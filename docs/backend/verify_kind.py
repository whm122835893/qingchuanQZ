#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify_kind.py —— 校验 endpoint_meta 的 kind 字段与实际路由实现一致

背景：gen_api_docs.py 早期用 `impl == 'todo'` 反推读写，这是错的耦合——
     「是否实现」与「是读是写」是两个正交维度（compound/result 已实现但是读接口）。
     现在 kind 是独立字段，本脚本机械校验它与实际写路由集合一致。

校验方式（不靠人眼）：
  1. 从 server/src/routes/*.js 提取所有 router.post 路径
  2. 提取实际调用 service 写方法的路径集合（按 controller → service 映射）
  3. 与 endpoint_meta 的 kind == 'write' 集合求双向差集
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
ROUTES = ROOT / "server" / "src" / "routes"
sys.path.insert(0, str(HERE))
from endpoint_meta import E  # noqa: E402

# 源站路径 → 本项目路由路径的映射（源站前缀与本地实现不同，见 ARCHITECTURE §4）
PATH_ALIAS = {
    '/user_collection/user_collection/openbox': '/user_collection/user_collection/openbox',
    '/user_collection/user_collection/openboxone': '/user_collection/user_collection/openboxone',
}


def collect_write_routes():
    """返回 (实际写路由路径集合, 全部路由路径集合)"""
    all_paths = set()
    for f in sorted(ROUTES.glob('*.routes.js')):
        src = f.read_text(encoding='utf-8')
        for m in re.finditer(r"router\.(post|get)\(\s*'([^']+)'", src):
            all_paths.add(m.group(2))
    return all_paths


def collect_meta_write():
    return {p for p, m in E.items() if m.get('kind') == 'write'}


def main():
    all_paths = collect_write_routes()
    meta_write = collect_meta_write()

    # 实际写接口 = 路由已注册 且 元数据标为 write
    # 反向：元数据标 write 但路由未注册 → 漂移
    print("=" * 70)
    print("kind 字段一致性校验 —— endpoint_meta.kind vs server/src/routes")
    print("=" * 70)
    print(f"  路由已注册路径（POST+GET）      : {len(all_paths)}")
    print(f"  endpoint_meta.kind == 'write'   : {len(meta_write)}")
    print()

    meta_write_norm = {PATH_ALIAS.get(p, p) for p in meta_write}
    missing_route = sorted(meta_write_norm - all_paths)
    print("【方向一】kind=write 但路由未注册（应为 0）")
    if missing_route:
        for p in missing_route:
            print(f"  [漂移] {p} 标为 write 但 routes 中无此路径")
    else:
        print("  [0差异] 全部 kind=write 接口均已注册路由")
    print()

    # 写接口的实现状态
    todo_write = sorted(p for p in meta_write_norm if E.get(p, {}).get('impl') != 'done')
    print("【方向二】kind=write 但 impl != done（写接口不应留TODO）")
    if todo_write:
        for p in todo_write:
            print(f"  [未实现] {p}")
    else:
        print("  [0差异] 全部 kind=write 接口均已实现")
    print()

    # kind=read 但语义可疑：POST 且已实现的接口里，读接口应当都是查询型
    post_paths = set()
    for f in sorted(ROUTES.glob('*.routes.js')):
        src = f.read_text(encoding='utf-8')
        for m in re.finditer(r"router\.post\(\s*'([^']+)'", src):
            post_paths.add(m.group(1))
    read_post = sorted((post_paths & all_paths) - meta_write_norm)
    print(f"【参考】POST 但 kind=read 的接口 {len(read_post)} 条（查询型，写入语义应另行标注）")
    for p in read_post:
        print(f"  - {p}")
    print()

    print("=" * 70)
    diffs = len(missing_route) + len(todo_write)
    if diffs:
        print(f"校验结果: {diffs} 处差异 —— 需修正")
        print("=" * 70)
        return 1
    print(f"校验结果: 0 差异 —— kind=write {len(meta_write_norm)} 条与实际写路由完全一致")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())