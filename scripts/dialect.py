#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""dialect.py — 数据库方言适配层

职责边界（关键：映射逻辑只有一份，DDL/类型/写入差异全部收敛在本文件）：
  1. 连接：SQLite（默认，标准库 sqlite3）/ MySQL 8.0（可选，DB env 切换）
  2. DDL：SQLite 读 scripts/schema_sqlite.sql（由 convert_schema.py 生成）；
           MySQL 直接读 docs/schema.sql
  3. 建表顺序：按「父表在前」拓扑排序，保证外键依赖（schema 物理顺序已满足）
  4. 写入：统一 executemany 批量插入 + 占位符风格差异
  5. 校验：SQLite 用 PRAGMA foreign_key_check；MySQL 用 information_schema 查询

【为什么需要方言层】SQLite 与 MySQL 的 DDL 差异（类型名、AUTO_INCREMENT、
ENGINE/CHARSET 子句、索引行内声明、校验方式）若散落在映射代码里，会出现两份
映射逻辑 inevitably 不一致。故此处只暴露统一接口给 mappers.py。
"""
from __future__ import annotations

import os
import sqlite3
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SQLITE_DDL = ROOT / "scripts" / "schema_sqlite.sql"
MYSQL_DDL = ROOT / "docs" / "schema.sql"

# 表创建顺序 = docs/schema.sql 的物理顺序（该脚本已按外键依赖排序，见其附录一）
TABLE_ORDER: list[str] = []


def load_table_order() -> list[str]:
    """从 SQLite DDL 解析建表顺序，保证与 schema 一致且不手抄。"""
    global TABLE_ORDER
    if TABLE_ORDER:
        return TABLE_ORDER
    import re

    text = SQLITE_DDL.read_text(encoding="utf-8")
    TABLE_ORDER = re.findall(r"CREATE TABLE `(\w+)`", text)
    return TABLE_ORDER


class Dialect:
    """方言基类：统一接口，具体差异由子类实现。"""

    name = "base"

    def __init__(self, **kwargs):
        self.conn = None

    # --- 建库 -----------------------------------------------------------
    def connect(self):  # pragma: no cover - 抽象
        raise NotImplementedError

    def ddl_text(self) -> str:  # pragma: no cover - 抽象
        raise NotImplementedError

    def create_schema(self):
        """执行 DDL。MySQL 需按语句切分（sqlite3 executescript 不适用）。"""
        raise NotImplementedError

    # --- 写入 -----------------------------------------------------------
    def insert_many(self, table: str, columns: list[str], rows: list[dict]):
        raise NotImplementedError

    def count(self, table: str) -> int:
        raise NotImplementedError

    def scalar(self, sql: str, params=()):
        cur = self.conn.execute(sql, params)
        row = cur.fetchone()
        return row[0] if row else None

    def rows(self, sql: str, params=()):
        return self.conn.execute(sql, params).fetchall()

    # --- 校验 -----------------------------------------------------------
    def fk_violations(self) -> list[tuple]:
        raise NotImplementedError

    def close(self):
        if self.conn:
            self.conn.close()


class SQLiteDialect(Dialect):
    """SQLite 方言（默认目标，纯标准库）。

    ⚠ 外键约束**全程开启**（DATABASE.md §7.1：v1.1 起users 等弱引用已降级，
    灌库不再需要关闭约束）。上一版用 `PRAGMA foreign_keys=OFF` 灌库再
    `foreign_key_check`，等于把校验变成自欺欺人（QA 在该状态下实测 141 条违规），
    已彻底移除。

    如需排查「关约束后能否灌完」（仅诊断用，绝不作为交付路径）：
        ALLOW_FK_OFF=1 python3 scripts/seed.py
    该开关默认关闭；一旦使用，报告 validation.foreign_keys_enforced 会置为false
    并在控制台显著告警——不允许把这种状态当作校验通过的依据。
    """

    name = "sqlite"
    PH = "?"  # 占位符

    def __init__(self, path: str | Path = ROOT / "data" / "qingchuan.db", **kw):
        super().__init__()
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.path))
        self.fk_enforced = os.environ.get("ALLOW_FK_OFF") != "1"
        self.conn.execute(
            "PRAGMA foreign_keys=ON" if self.fk_enforced else "PRAGMA foreign_keys=OFF"
        )
        # DECIMAL 无原生类型：以 TEXT 亲和存储 Decimal 字符串，避免 float 精度损失
        # （DATABASE.md §6.4：禁止 FLOAT/DOUBLE，分账字段涉精度）
        self.conn.text_factory = str

    def ddl_text(self) -> str:
        return SQLITE_DDL.read_text(encoding="utf-8")

    def create_schema(self):
        self.conn.executescript(self.ddl_text())
        self.conn.commit()

    def _adapt(self, v):
        """Python 值 → SQLite 可绑定值。Decimal 存字符串，保留精度。"""
        if isinstance(v, Decimal):
            return format(v, "f")
        if isinstance(v, bool):
            return int(v)
        return v

    def insert_many(self, table, columns, rows):
        if not rows:
            return
        ph = ",".join([self.PH] * len(columns))
        sql = f"INSERT INTO `{table}` ({','.join('`'+c+'`' for c in columns)}) VALUES ({ph})"
        data = [tuple(self._adapt(r.get(c)) for c in columns) for r in rows]
        self.conn.executemany(sql, data)

    def count(self, table: str) -> int:
        return int(self.scalar(f"SELECT COUNT(*) FROM `{table}`"))

    def fk_violations(self) -> list[tuple]:
        return list(self.conn.execute("PRAGMA foreign_key_check"))

    def commit(self):
        self.conn.commit()


class MySQLDialect(Dialect):
    """MySQL 8.0 方言（可选，需 DB 环境变量）。

    环境变量：DB=mysql / DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
    依赖：PyMySQL 或 mysqlclient（缺失时给出明确提示，不静默降级）。
    """

    name = "mysql"
    PH = "%s"

    def __init__(self, **kw):
        super().__init__()
        try:
            import pymysql  # noqa: F401
        except ImportError as exc:  # pragma: no cover
            raise SystemExit(
                "MySQL 模式需要 PyMySQL：pip install pymysql（SQLite 模式无需任何依赖）"
            ) from exc
        import pymysql

        self.conn = pymysql.connect(
            host=os.environ.get("DB_HOST", "127.0.0.1"),
            port=int(os.environ.get("DB_PORT", "3306")),
            user=os.environ.get("DB_USER", "root"),
            password=os.environ.get("DB_PASSWORD", ""),
            database=os.environ.get("DB_NAME", "qingchuan"),
            charset="utf8mb4",
            autocommit=False,
        )

    def ddl_text(self) -> str:
        return MYSQL_DDL.read_text(encoding="utf-8")

    def create_schema(self):
        """MySQL DDL 按分号切分逐条执行（保留源脚本的 SET FOREIGN_KEY_CHECKS）。"""
        import re

        sql = re.sub(r"--[^\n]*", "", self.ddl_text())
        cur = self.conn.cursor()
        for stmt in [s.strip() for s in sql.split(";") if s.strip()]:
            cur.execute(stmt)
        self.conn.commit()

    def _adapt(self, v):
        """MySQL 侧 Decimal 原生支持，直接透传（由驱动按 DECIMAL 精度落库）。"""
        if isinstance(v, bool):
            return int(v)
        return v

    def insert_many(self, table, columns, rows):
        if not rows:
            return
        ph = ",".join([self.PH] * len(columns))
        sql = f"INSERT INTO `{table}` ({','.join('`'+c+'`' for c in columns)}) VALUES ({ph})"
        data = [tuple(self._adapt(r.get(c)) for c in columns) for r in rows]
        cur = self.conn.cursor()
        cur.executemany(sql, data)

    def count(self, table: str) -> int:
        cur = self.conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM `{table}`")
        return int(cur.fetchone()[0])

    def fk_violations(self) -> list[tuple]:
        """MySQL 无 PRAGMA 等价物，改用 information_schema 查孤儿行。"""
        cur = self.conn.cursor()
        cur.execute(
            """
            SELECT rc.TABLE_NAME, rc.CONSTRAINT_NAME, rc.COLUMN_NAME,
                   (SELECT k.REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE k
                     WHERE k.CONSTRAINT_SCHEMA=rc.CONSTRAINT_SCHEMA
                       AND k.CONSTRAINT_NAME=rc.CONSTRAINT_NAME
                       AND k.ORDINAL_POSITION=rc.ORDINAL_POSITION) AS ref_table,
                   (SELECT k.REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE k
                     WHERE k.CONSTRAINT_SCHEMA=rc.CONSTRAINT_SCHEMA
                       AND k.CONSTRAINT_NAME=rc.CONSTRAINT_NAME
                       AND k.ORDINAL_POSITION=rc.ORDINAL_POSITION) AS ref_col
              FROM information_schema.REFERENTIAL_CONSTRAINTS rc
             WHERE rc.CONSTRAINT_SCHEMA = DATABASE()
            """
        )
        out = []
        for tname, cname, col, rtab, rcol in cur.fetchall():
            cur.execute(
                f"SELECT COUNT(*) FROM `{tname}` c LEFT JOIN `{rtab}` p "
                f"ON c.`{col}` = p.`{rcol}` WHERE c.`{col}` IS NOT NULL AND p.`{rcol}` IS NULL"
            )
            n = int(cur.fetchone()[0])
            if n:
                out.append((tname, cname, col, rtab, rcol, n))
        return out

    def commit(self):
        self.conn.commit()


def create_dialect(kind: str | None = None, **kw) -> Dialect:
    """按环境变量或参数创建方言实例。DB 未设置时默认 sqlite。"""
    kind = (kind or os.environ.get("DB", "sqlite")).lower()
    if kind == "mysql":
        return MySQLDialect(**kw)
    if kind == "sqlite":
        return SQLiteDialect(**kw)
    raise SystemExit(f"未知 DB 类型：{kind}（支持 sqlite / mysql）")
