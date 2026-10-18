#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify_paths.py — 接口路径一致性门禁

铁律：路径错一处 = 前端整页白屏。本脚本机器化校验三方一致性：
    ① src/api/index.js   （唯一事实源）
    ② docs/backend/API.md
    ③ docs/backend/openapi.yaml
外加元数据层endpoint_meta.py（生成源）自检。

退出码 0 = 零差异（可放行）；非 0 = 存在差异（禁止交付）。

用法：
    python3 docs/backend/verify_paths.py            # 校验
    python3 docs/backend/verify_paths.py --report    # 追加逐条清单
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
API_JS = ROOT / "src" / "api" / "index.js"
API_MD = HERE / "API.md"
OPENAPI = HERE / "openapi.yaml"

# ---------------------------------------------------------------------------
# 已知脏键豁免：MOCK_MAP 中误登记为「路径」的文件名，不是接口路径。
# /addons_diypage_index 来自 public/mock/diypage.json 的文件名，
# 真路径是 /addons/diypage/index（已正确登记）。localRequest 永不命中该键。
# 豁免而非静默忽略 —— 它必须出现在下方报告中，让人看见它需要被清理。
# ---------------------------------------------------------------------------
DIRTY_KEYS = {
    '/addons_diypage_index': '误登记的 mock 文件名，真路径为 /addons/diypage/index',
}


def norm(p: str) -> str:
    """模板变量归一：/ids/${id} -> /ids/{id}"""
    return re.sub(r"\$\{[^}]+\}", "{id}", p)


def from_source():
    """从 src/api/index.js 提取路径、函数复用关系、MOCK_MAP 登记"""
    s = API_JS.read_text(encoding="utf-8")
    calls = re.findall(r"request\(\s*[`'\"](/[^`'\"]*)", s)
    fns = {}
    for m in re.finditer(r"^\s{2}([a-zA-Z_]\w*):\s*(.*?)$", s, re.M):
        p = re.search(r"request\(\s*[`'\"](/[^`'\"]*)", m.group(2))
        if p:
            fns[m.group(1)] = norm(p.group(1))
    fns["login"] = "/user/login"   # 条件分支内直接调 request，正则未覆盖
    mock_map = set(re.findall(r"^\s*'(/[^']+)'\s*:\s*", s, re.M))
    return {norm(p) for p in calls}, fns, mock_map


def from_api_md() -> set:
    return set(re.findall(r"^\| \d+ \| `(/[^`]+)` \|", API_MD.read_text(encoding="utf-8"), re.M))


def from_openapi() -> set:
    out, in_paths = set(), False
    for line in OPENAPI.read_text(encoding="utf-8").splitlines():
        if line == "paths:":
            in_paths = True
            continue
        if in_paths:
            if line and not line.startswith(" "):
                break
            m = re.match(r'^  "?(/[^"]+)"?:$', line)
            if m:
                out.add(m.group(1))
    return out


def from_endpoint_meta() -> set:
    sys.path.insert(0, str(HERE))
    from endpoint_meta import E
    return set(E)


def main() -> int:
    report = "--report" in sys.argv
    src_used, fns, src_mockmap = from_source()
    src_all = (src_used | src_mockmap) - set(DIRTY_KEYS)
    src_all_live = src_used - set(DIRTY_KEYS)   # 活跃：有 request() 调用
    src_all_dead = src_all - src_used # 仅登记：只在 MOCK_MAP，无函数调用

    md = from_api_md()
    oa = from_openapi()
    meta_paths = from_endpoint_meta()

    W = 68
    print("=" * W)
    print("接口路径一致性校验 —— src/api/index.js vs API.md vs openapi.yaml")
    print("=" * W)
    print()
    print("【数量统计】")
    print("  src/api/index.js  request() 调用唯一路径 : %3d" % len(src_used))
    print("  src/api/index.js  MOCK_MAP 登记路径      : %3d（含 1 脏键）" % len(src_mockmap))
    print("  事实源并集（已剔除脏键）                   : %3d" % len(src_all))
    print("      ├─ 活跃（有 api 函数调用）            : %3d" % len(src_all_live))
    print("      └─ 仅 MOCK_MAP 登记（无函数调用）      : %3d" % len(src_all_dead))
    print("  endpoint_meta.py  元数据                 : %3d" % len(meta_paths))
    print("  API.md            总览表路径              : %3d" % len(md))
    print("  openapi.yaml      paths                 : %3d" % len(oa))
    print()

    diffs = []

    def cmp(label, a, b):
        only_a, only_b = sorted(a - b), sorted(b - a)
        if not only_a and not only_b:
            print("  [0差异] %-38s %d条完全一致" % (label, len(a)))
        else:
            print("  [差异 ] %s" % label)
            for p in only_a:
                print("           事实源有、文档缺 : %s" % p)
                diffs.append((label, p, "missing_in_doc"))
            for p in only_b:
                print("           文档有、事实源无 : %s" % p)
                diffs.append((label, p, "extra_in_doc"))
        print()

    print("【集合比对】")
    cmp("endpoint_meta.py  vs 事实源", src_all, meta_paths)
    cmp("API.mdvs 事实源", src_all, md)
    cmp("openapi.yaml       vs 事实源", src_all, oa)
    cmp("API.md            vs openapi.yaml", md, oa)
    print()

    print("【逐字比对】不做归一化，检测大小写/空白/模板变量残留")
    literal_ok = True
    for p in sorted(src_all):
        if p in md and p != p.strip():
            print("  API.md 含多余空白: %r" % p)
            diffs.append(("字面量", p, "whitespace"))
            literal_ok = False
        if p in oa and re.search(r"\$\{", p):
            print("  openapi.yaml 残留模板变量: %s" % p)
            diffs.append(("字面量", p, "template_var"))
            literal_ok = False
    # 动态路径在 openapi 中须为 {id}
    for p in sorted(src_all):
        if "{id}" in p:
            norm_oa = re.sub(r"\{[a-z_]+\}", "{id}", p)
            if norm_oa not in oa:
                print("  openapi.yaml 动态段未规范为 {id}: %s" % p)
                diffs.append(("字面量", p, "dynamic_path"))
                literal_ok = False
    print("  结论: %s" % ("全部路径逐字一致（大小写、空格、动态段均无差异）"
                          if literal_ok else "存在字面量差异，见上"))
    print()

    print("【已知脏键豁免】%d 条 —— 不属于接口路径，需前端清理" % len(DIRTY_KEYS))
    for p, why in DIRTY_KEYS.items():
        print("  %-30s %s" % (p, why))
    print()

    dup = {}
    for fn, p in fns.items():
        dup.setdefault(p, []).append(fn)
    dups = {p: n for p, n in dup.items() if len(n) > 1}
    print("【路径复用】%d 组 —— 源站多函数指向同一路径，后端实现一份即可" % len(dups))
    for p, names in sorted(dups.items()):
        print("  %s  (%d 函数)" % (p, len(names)))
        print("      %s" % ', '.join(sorted(names)))
    print()

    print("【仅登记未调用】%d 条 —— MOCK_MAP 已登记但当前无 api 函数" % len(src_all_dead))
    for p in sorted(src_all_dead):
        print("  %-46s %s" % (p, "已文档化" if p in md else "未文档化"))
    print()

    print("【鉴权标记一致性】API.md 总览表「鉴权」列 vs endpoint_meta.auth")
    meta = _meta()
    md_text = API_MD.read_text(encoding="utf-8")
    auth_bad = []
    seen_auth = 0
    for p, v in re.findall(r"^\| \d+ \| `(/[^`]+)` \|.*?\| (是|否) \|", md_text, re.M):
        if p not in meta:
            continue
        seen_auth += 1
        want = '是' if meta[p]['auth'] else '否'
        if v != want:
            auth_bad.append((p, v, want))
    print("  已校验 %d 条接口的鉴权标记" % seen_auth)
    if auth_bad:
        for p, got, want in auth_bad:
            print("  [差异] %-46s API.md=%s 元数据=%s" % (p, got, want))
            diffs.append(("鉴权标记", p, "%s!=%s" % (got, want)))
    else:
        print("  [0差异] 鉴权标记全部一致")
    print()

    print("=" * W)
    if diffs:
        print("校验结果: %d 处差异 —— 不可交付" % len(diffs))
        for label, p, kind in diffs:
            print("  · [%s] %s (%s)" % (label, p, kind))
        print("=" * W)
        return 1
    print("校验结果: 0 差异 —— 放行")
    # 读写口径：按 kind 字段统计，不得用 impl 反推
    # （「是否实现」与「是读是写」正交——compound/result 已实现但是读接口）
    meta = _meta()
    print("覆盖 %d/%d 条事实源路径，%d 条读接口 + %d 条写接口（按 kind 字段统计）"
          % (len(md), len(src_all),
             sum(1 for m in meta.values() if m.get('kind') != 'write'),
             sum(1 for m in meta.values() if m.get('kind') == 'write')))
    print("=" * W)
    return 0


def _meta():
    sys.path.insert(0, str(HERE))
    from endpoint_meta import E
    return E


if __name__ == "__main__":
    sys.exit(main())
