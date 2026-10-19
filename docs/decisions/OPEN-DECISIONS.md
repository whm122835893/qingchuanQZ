# OPEN-DECISIONS 悬而未决登记册

> 只追加 + 就地关闭（OPEN → RESOLVED，补 Resolution 字段）。已关闭项可升格为 ADR。
> 来源 Phase 列标注该决策产生于哪个阶段。

| Date | Source | Open Item | Related Constraints | Current Leaning | Blocked By | Resolves When | Status |
|------|--------|-----------|---------------------|-----------------|------------|---------------|--------|
| 2026-10-19 | Phase 3 | antMycollection 的 has_sold 枚举语义（1=已售出/2=已赠送）与 types=2 是否排除 has_sold≠0 | 源站账号数据已清空，服务端过滤 SQL 不可见；前端 bundle 零引用 has_sold；观测仅 6003=1、6006=2 两行非零 | 按枚举裁决：1=已售出、2=已赠送；types=2 排除 has_sold≠0 使四 tab 互斥不双计（青川山水藏品 tab 计 2、已售 tab 计 8） | 源站账号无数据可实测 | 源站恢复该账号数据或拿到服务端过滤逻辑时复核 | OPEN |
| 2026-10-20 | Phase 3 | MyCollection.vue 数据源仍为 myCollectionList（/market/trade/userCollectionList，mock 空态），源站实证该页与 my 页同走 antMycollection（tabs 藏品=2/盲盒=1/已售出=3/已赠送=4） | TABS 枚举已按源站修正，但列表取数端点未切换；切换后 getDetail 弹窗锚点 id 语义需复核（list.id vs collection.id） | 维持现状待用户预览确认后再切端点，避免一次改两处引发回归 | 用户预览确认 | 用户确认 my 页预览效果后切换并复测 | OPEN |
| 2026-10-20 | Phase 3 | 「分享App」菜单源站为 action:share 弹出 InvitePoster（l-painter 海报画布，未复刻），暂跳 /pages/index/downloadApp | l-painter  canvas 海报依赖分享素材与二维码生成，超出本轮 my 页接线范围 | 暂跳下载页保底，海报复刻列入后续独立任务 | 海报画布取证（l-painter actions + 模板） | 单独排期复刻 InvitePoster 时 | OPEN |
