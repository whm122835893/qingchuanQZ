# 数据灌库脚本

把 `public/mock/` 下的源站 mock 灌入 `docs/schema.sql` 定稿的 48 张表。

## 一条命令跑通（默认 SQLite，零第三方依赖）

```bash
cd /workspace/qingchuan-h5 && python3 scripts/seed.py
```

产物：
- `data/qingchuan.db` —— SQLite 灌库结果
- `data/seed-report.json` —— 灌库报告（表行数 / 孤儿行明细 / 校验结果 / 跳过台账）

## 切 MySQL 8.0（可选）

```bash
DB=mysql DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=root DB_PASSWORD=xxx \
  DB_NAME=qingchuan python3 scripts/seed.py
```

MySQL 分支需要 `PyMySQL`（唯一可选依赖）。**未安装时会立即抛出带指引的ImportError，不静默降级**。

SQLite 与 MySQL 的 DDL / 类型 / 占位符 / 校验方式差异全部隔离在 `dialect.py`，
映射逻辑只有一份，不存在两套实现。

## 文件职责

| 文件 | 职责 |
|------|------|
| `seed.py` | 编排：加载 mock → 两阶段灌库 → 校验 → 出报告。不含字段映射 |
| `convert_schema.py` | MySQL DDL → SQLite DDL 转换器（类型亲和映射 / 剥离注释 / 索引提取） |
| `sql_scan.py` | DDL 词法切分原语（语句 / 顶层项 / 表体），手写扫描器而非正则，原因见文件头 |
| `fk_normalize.py` | 外键强度分级落地：方案 X 归一化 + `_raw` 留痕审计 |
| `schema_sqlite.sql` | **由上者自动生成**，勿手改。schema 变更后重跑 `python3 scripts/convert_schema.py` |
| `dialect.py` | 方言适配层：建表 / 批量插入 / 外键校验的双方言差异 |
| `clean.py` | 清洗原语：金额 Decimal、时间形态判定、枚举字典、mock 统一解包 |
| `mappers.py` | mapper 聚合入口，声明「哪个 mock 经哪个 mapper 灌进哪张表」 |
| `mappers_*.py` | 按领域分包的字段映射（12 个文件，均 ≤ 300 行） |
| `validate.py` | 列元信息读取 + 灌库后三项自检 |

分层：`seed（编排） → fk_normalize（外键归一化） → mappers（映射） → clean（清洗原语） → dialect（方言/写入）`，
单向依赖，无反向调用。

## 分包划分

```
mappers_user       A 域 用户 + G 域 配置
mappers_catalog    B1 series / B3 藏品池 / B4 销售规则
mappers_product    B2 products（8 源合并）
mappers_collection B5~B7 藏品实例 + F1 行情统计
mappers_trade      C1 市场挂单 / C2 买单订单
mappers_entrust    C3 委托单 / C4 K线快照
mappers_activity   D1 活动 / D2 合成
mappers_lottery    D3 抽奖 / D4 签到
mappers_shop       D5 商城 / D6 晶石流水
mappers_community  E1 社区帖子与评论
mappers_content    E2~E4 公告 / 装修 / 资讯
mappers_growth     F2 榜单快照 / F3 返佣邀请 / F4 转赠记录
```

## 关键清洗规则（依据 DATABASE.md）

| 规则 | 实现位置 |
|------|---------|
| 金额禁用 float 中转，一律 `decimal.Decimal` | `clean.dec()` |
| SQLite 无 DECIMAL 亲和 → 存字符串保精度 | `dialect.SQLiteDialect` |
| 非标准时间（`"10-16 09:24"` / `"18:26:45"` / 雪花 ID）保持 VARCHAR 不 CAST | `clean.to_unix()` / `str_col()` |
| `collection_code` 双列 + `orders.collection_code_raw` 留痕（裁决 A） | `mappers_trade.map_orders` |
| `income_type` 单值 + raw；数字 `1` 不映射为 huifu（裁决 B） | `clean.income_type()` |
| `goods_type` 藏品域 / 商城域分表（裁决 C） | 各域独立映射，枚举由 `clean.ENUMS` 分开定义 |
| `order_status` 买单域 / 委托域分设（裁决 D） | `clean.ENUMS` 分开定义 |
| `create_time_str` 不补全年份（裁决 E） | `mappers_community` |
| 纯空格串 → NULL，空串保留原样 | `clean.clean_str()` |
| `token` 字段丢弃不入库 | `mappers_user.map_users` |

## 外键完整性（v1.1 重做，务必读完）

### 灌库全程 `PRAGMA foreign_keys=ON`

上一版用 `PRAGMA foreign_keys=OFF` 灌库、事后 `foreign_key_check`，
并在报告里写 `"pass"` —— 那是**校验逻辑造假**：约束关着时检查的是
「已关闭约束下的残留状态」，通过毫无意义（QA 独立执行实测 **141 条违规**）。
现已彻底移除该行为，灌库全程约束生效。

诊断用的开关保留但**默认关闭**，且开启后报告会自我否证，不会伪装成通过：

```bash
ALLOW_FK_OFF=1 python3 scripts/seed.py   # 仅用于排查，绝非交付路径
```

| 模式 | `foreign_keys_enforced` | `foreign_key_check` |
|------|------|------|
| 默认（ON） | `true` | `pass` / `fail`（真实结论） |
| `ALLOW_FK_OFF=1` | `false` | `inconclusive(约束未生效，结果无效)` |

控制台在 OFF 模式下会打印显著告警。

### 方案X：0/ 悬空 → NULL + `_raw` 留痕（DATABASE.md §7.1.4）

`fk_normalize.py` 在灌库前统一归一化，规则只有一条：
**有效 ID 落 `xxx_id`（受强 FK 约束），无效值落 NULL、原值写 `xxx_id_raw`**。

- 归一化范围 = 17 个强 FK 列 ∪ 9 个带 `_raw` 的 ID 类弱引用列，
  父子关系从 `schema_sqlite.sql` 解析，不手抄。
- 无 `_raw` 列的弱引用（如全部指向 `users.id` 的 21 列）**原值原样保留**：
  无 FK 约束故不违规，且 schema 未给留痕列，改 NULL 等于销毁源站事实。

⚠ **「源站没给」与「源站给了 0」必须区分**：`0` 是源站真实观测值（=未成交），
留痕 `_raw='0'`；mapper 里用 `0` 冒充「本 mock 没这个字段」会伪造源站痕迹，
故缺失一律写 `None`（→ NULL）。修正后归一化量从 141 降到 **21**
（余下 21 条为真实悬空：`series_id=14` ×16、`product_id=210` ×3 等）。

### 外键引用不到父记录的行绝不静默跳过

不填 0、不臆造 ID，一律 NULL + `_raw` 留痕，并逐条记入报告
`fk_normalization.nullified`（表名 / 列 / 源值 / 父表）。

## 自检项

1. `PRAGMA foreign_key_check` —— 约束生效状态下运行，空则 pass
2. 每表 `SELECT COUNT(*)` —— 写入后立即回读并记入报告
3. NOT NULL 违规扫描
4. 枚举越界扫描（16 组配置）
5. **双向列校验**（两个方向都必须 0 差异）：
   - 方向 1：mapper 填了 schema 没有的列 → `mapper_extra_columns`
   - 方向 2：schema 有数据的列 mapper 未覆盖 → 写入前需人工核对
6. **`schema_pending`**：schema 自身缺陷（区别于数据层孤儿行），
   即使数据全对也依然存在，必须上报

> 枚举越界分两类，报告中分开列：
> - `enum_out_of_range`：源站给了非法枚举（脏数据），当前 **0 项**
> - `schema_default_fallback`：源站未提供该字段，取了 schema 的 `NOT NULL DEFAULT 0`，
>   而 0 不在 DATABASE.md §4 枚举字典内 —— 这是 schema 定义与枚举字典自相矛盾，
>   如实记录不掩盖

## schema 变更后

```bash
python3 scripts/convert_schema.py   # 重新生成 schema_sqlite.sql
python3 scripts/seed.py            # 重新灌库（会重建库）
```

## 独立审计（audit.py）

`seed.py` 的自检与灌库共用 `dialect / mappers / fk_normalize / convert_schema`，
若这几处有同一个 bug，自检会「自己造的数据自己校验通过」。`audit.py` 就是防这个：

| 维度 | seed.py 自检 | audit.py 独立审计 |
|------|-------------|-------------------|
| 约束来源 | `schema_sqlite.sql`（转换产物） | `docs/schema.sql`（架构师原稿，重新词法解析） |
| 孤儿检测 | `PRAGMA foreign_key_check` | 每条 FK 独立写一条 `LEFT JOIN` |
| 代码复用 | 灌库链路 | 零复用，启动时自检是否误加载链路模块 |

```bash
python3 scripts/audit.py     # 产出 data/audit-report.json，退出码 0=全绿
```

独立性保障：`audit.py` + `audit_parse.py` 只 import 标准库与彼此；
若运行时检测到 `dialect / mappers / seed / fk_normalize / convert_schema /
clean / validate / sql_scan` 任一被加载，直接退出码 2 并打印泄漏模块名。

## 已知 schema 缺陷（v1.2 已清零，详见报告 `schema_pending`）

| id | v1.1 状态 | v1.2 状态 |
|----|----------|----------|
| `schema_raw_missing_comma` | blocking：12 个 `_raw` 列漏逗号 + 3 类语法问题 | **resolved**：`repair_missing_commas` 回归检测 0 命中 |
| `app_configs_pk_not_composite` | medium：`config_key` 单列主键，mapper 用 `group:key` 前缀绕过 | **resolved**：复合主键 `(config_group, config_key)`，mapper 已删前缀，改具名参数 |
| `enum_column_default_0_vs_dictionary` | medium：枚举列 `NOT NULL DEFAULT 0`，0 不在 §4 字典 | **resolved**：15 个枚举列改 `DEFAULT NULL`，mapper 缺值写 NULL，`schema_default_fallback` 0 项 |
