-- =============================================================================
-- 青川数字艺术 H5 平台 · MySQL 8.0 建表脚本
-- =============================================================================
-- 版本：v1.2 · 生成日期 2026-10-18 · 状态：已定稿
-- 版本变更记录：
--   v1.1 -> v1.2（缺陷修复，非设计变更）：
--     (a) 修复 12 个_xxx_raw 列行尾漏逗号（DDL 在 MySQL 8.0 无法执行，阻塞级）
--     (b) 修复 2 处 CONSTRAINT 行「逗号被-- 行注释吞掉」（market_listings /
--         community_comments），逗号前移到 ON UPDATE CASCADE 之后
--     (c) 修复 2 处表内末行多余逗号（user_sign_status / rebate_profiles）
--     (d) app_configs 主键改复合 (config_group, config_key)，修正 config_key
--         单列主键无法区分 basic/trade 同名 appName 的设计缺陷
--     (e) 枚举列 DEFAULT 裁决：0 不在枚举字典内的列改NULL DEFAULT NULL，
--         共 15 列，COMMENT 内注明「0 不在本枚举取值范围内」
-- 设计文档：docs/DATABASE.md（本文为其可执行落地，字段与 §3 表清单逐条对应）
-- 数据来源：public/mock/ 下 78 个 JSON（源站 API 真实响应快照）
--
-- 【字段来源声明】
--   本 SQL 所有业务字段均由源站 78 个 mock 的真实字段推导，未臆造字段。
--   凡非源站字段，均在列 COMMENT 中以「设计新增」四字显式标注。
--
-- 【枚举存储约定】
--   一律使用 TINYINT / VARCHAR 存储枚举值 + 列 COMMENT 标注语义，
--   严禁使用 MySQL ENUM 类型。原因：源站枚举会增删改值（已实测 goods_type 跨域
--   语义冲突、order_status 分域），MySQL ENUM 改值属 DDL 灾难（锁表 + 重建）。
--
-- 【裁决落地要点】（详见 DATABASE.md §10）
--   A. collection_code VARCHAR(64) + collection_code_num BIGINT 双列；
--      orders 表另设 collection_code_raw 存源站错位原值（原值保留 + 派生值双写）。
--   B. income_type 单值列 + income_type_raw 原值列；数字 1 不映射，保持 NULL。
--   C. goods_type 分表各用自己的枚举：products/market_listings/orders/
--      product_market_stats = 藏品域(1盲盒2单品)；shop_goods = 商城域(1数字藏品2盲盒3合集)。
--   D. order_status 分域：orders = 买单域(0/1/2/3/4，不臆造 7)；
--      entrust_orders = 委托域(2委托中/3已成交/4已取消)。
--   E. community_posts / community_comments 的 create_time_str 保持 VARCHAR(32)，
--      不补全年份（补全年份属数据伪造）。
--
-- 【外键强度分级】（v1.1 修订，详见 DATABASE.md §7.1）
--   上一版把「源站可能返回 0 或悬空 ID」的所有关联一律建成硬FK，属设计缺陷：
--   实测 SQLite `PRAGMA foreign_key_check` 报出 141 条违规，根因全部是弱引用。
--   现按两级管理：
--   1) 强 FK（17 个）：业务上必然存在、且父记录一定在库的关联，落地为
--      FOREIGN KEY 约束。判据=父记录与子记录来自同一 mock 或同一业务聚合。
--      products.series_id / product_pool_items.product_id / product_sale_rules.product_id /
--      user_collections.product_id / market_listings.product_id + collection_id /
--      orders.product_id / order_cards.order_id / user_shop_exchanges.order_id /
--      compound_scheme_items.scheme_id / user_compound_records.scheme_id /
--      compound_results.record_id / community_comments.post_id + parent_id（自引用两级）/
--      chat_messages.session_id / product_market_stats.product_id / regift_records.collection_id
--   2) 弱引用（26 列，不建 FK，仅建索引 + COMMENT 标注）：源站可能给 0、给悬空 ID，
--      或根本不返回该字段。判据=父表覆盖不全（users 实测仅 4930/22291 两条，
--      挂单却引用 20+ 卖家）或接口无该字段（榜单接口不返回商品 ID）。
--      包括：所有指向 users.id 的列；所有实测出现 0 哨兵/悬空值的
--      product_id / series_id 列。
--   3) 混合列处理= 方案 X（0 值哨兵统一为 NULL + 保留源站原值列）：
--      有效 ID 落`xxx_id`（受强 FK 约束），无效值落 NULL，原值（含 0）留痕
--      `xxx_id_raw VARCHAR(64)`。共新增 12 个 _raw 列。
--      未选方案 Y（validated 标记位）：标记位与实际值可能不一致，且无法承载
--      源站原值，需额外校验逻辑；NULL 本身即三态语义，MySQL FK 天然放行 NULL。
--   4) 铁律：弱引用不等于裸奔——26 个弱引用列 100% 有索引（本次新增
--      idx_pms_series / idx_rank_product 两个）。
--
-- 【通用约定】
--   引擎 = InnoDB，字符集 = utf8mb4，排序规则 = utf8mb4_0900_ai_ci（MySQL 8.0 默认）
--   金额 = DECIMAL(18,4)，禁止 FLOAT/DOUBLE（分账字段涉精度，源站实测最大 128620.00）
--   时间 = BIGINT 存 unix 秒；非标准时间形态一律 VARCHAR，不强行 CAST（不伪造）
--   主键 = BIGINT UNSIGNED AUTO_INCREMENT（单列），设计新增的 created_at/updated_at 同理
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


-- ==========================================================================
-- A. 用户与账户域（4 张表）
-- ==========================================================================

-- A1 users：用户主表
-- 源 API：user.json → data.userinfo
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 userinfo.id：用户 ID（实测 22291）',
  `username` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 userinfo.username：登录名（实测手机号明文）',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 userinfo.nickname：昵称（实测自动生成）',
  `mobile` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 userinfo.mobile：手机号',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 userinfo.avatar：头像路径',
  `score` INT NOT NULL DEFAULT 0 COMMENT '源字段 userinfo.score：积分（实测 0）',
  `inviter_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 userinfo.inviter_code：我的邀请码（实测 E99022291）',
  `yao_count` INT NOT NULL DEFAULT 0 COMMENT '源字段 userinfo.yao_count：有效邀请人数（leaderboardUser 同义）',
  `huifu_service_charge` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 userinfo.huifu_service_charge：汇付手续费余额',
  `sandpay_service_charge` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 userinfo.sandpay_service_charge：桑达手续费余额',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_users_inviter_code` (`inviter_code`),
KEY `idx_users_mobile` (`mobile`),
KEY `idx_users_yao_count` (`yao_count` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='A1 users（用户主表）';

-- A2 user_addresses：收货地址
-- 源 API：addressList.json
DROP TABLE IF EXISTS `user_addresses`;
CREATE TABLE `user_addresses` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 address_id：地址 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：地址列表接口无 user_id，按登录态归属',
  `name` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 name：收件人（实测已脱敏）',
  `mobile` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 mobile：收件手机号（实测已脱敏 138****4027）',
  `province` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 province：省',
  `city` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 city：市',
  `area` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 area：区',
  `address` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 address：详细地址',
  `is_default` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_default：1=默认地址',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_addr_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='A2 user_addresses（收货地址）';

-- A3 user_invitations：邀请注册记录
-- 源 API：invitationRecord.json → data.list[]
DROP TABLE IF EXISTS `user_invitations`;
CREATE TABLE `user_invitations` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：邀请记录 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：邀请人',
  `invitee_mobile` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 mobile：被邀请人手机号（脱敏）',
  `invite_time` BIGINT NULL DEFAULT 0 COMMENT '源字段 create_time：实测为字符串 "1766000000"，灌库 CAST',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 status：E-INVITE-STATUS 0=待实名 1=实名通过 2=实名未通过',
  `remark` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 remark：与 status 一一对应',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_inv_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='A3 user_invitations（邀请注册记录）';

-- A4 user_invitation_assists：抽签助力记录（全民抽签助力，非邀请注册）
-- 源 API：invitationAssist.json → data.records[]
DROP TABLE IF EXISTS `user_invitation_assists`;
CREATE TABLE `user_invitation_assists` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：助力记录 ID',
  `code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 data.code：抽签码（如 QC-DRAW-3827-A1，同码下聚合多个助力人）',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：助力人',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 nickname：助力人昵称',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 avatar：助力人头像',
  `assist_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 create_time：实测 "2026-12-01 11:20:03" 字符串，故用 VARCHAR',
  `is_new_user` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_new_user：实测 true/false，统一转 0/1',
  `is_real` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_real：实测 true/false，统一转 0/1',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_uia_user` (`user_id`),
KEY `idx_uia_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='A4 user_invitation_assists（抽签助力记录（全民抽签助力，非邀请注册））';


-- ==========================================================================
-- B. 藏品与系列域（7 张表，核心域）
-- ==========================================================================

-- B1 series：藏品系列
-- 源 API：series-10.json / series-10-pid.json / categoryManager.json
DROP TABLE IF EXISTS `series`;
CREATE TABLE `series` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 series_id：系列 ID（实测 1~7/10/11/15）',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 series_name：系列名（实测「赛博系列」「赛博」，源站文案不统一，原样保留）',
  `is_def` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_def：1=默认系列',
  `flag` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 flag：实测全 0，语义未在页面消费，待确认',
  `pattern` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 pattern：实测 pattern=1 为「二级系列组」集合（series-10.json 返回 id=10/11）；pattern=0 为 categoryManager 的自营/平台系列（id=1~7）',
  `pid` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '源站行为推断列（非 mock 直接字段）：/index/getSeries 传 pid 时返回该系列的子系列。实测 type=10&pid=10 返回 series_id=15「赛博」，而非父系列 10「2026」，故父子关系成立。NULL=顶级系列。非源站直接返回字段，由 series-10 与 series-10-pid 两份快照对比得出',
  `category_group` TINYINT NULL DEFAULT NULL COMMENT '设计新增，非源站字段：1=自营(categoryManager.self_series) 2=平台(platform_series)；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `resale_put_start_time` VARCHAR(16) NULL DEFAULT '' COMMENT '源字段 resale_put_start_time：实测 "18:26:45" 纯时刻串，故用 VARCHAR',
  `resale_put_end_time` VARCHAR(16) NULL DEFAULT '' COMMENT '源字段 resale_put_end_time：同上',
  `resale_buy_start_time` VARCHAR(16) NULL DEFAULT '' COMMENT '源字段 resale_buy_start_time：同上',
  `resale_buy_end_time` VARCHAR(16) NULL DEFAULT '' COMMENT '源字段 resale_buy_end_time：同上',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B1 series（藏品系列）';

-- B2 products：藏品商品（发行主体）
-- 源 API：productDetail / marketGoodsList / shopGoodsDetail / noticeDetails / marketDetail
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：商品 ID（实测 222/225/226/236）',
  `series_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 series_id / series.id：所属系列，外键关联 series.id',
  `series_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：series_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `series_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：商品名称',
  `goods_type` TINYINT NULL DEFAULT NULL COMMENT '源字段 goods_type：E-GOODS-TYPE-COLLECTION 藏品域 1=盲盒 2=单品（裁决C：商城域枚举严禁混入本表）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：列表图（?image_process= 参数原样保留，前端 ossImg 依赖）',
  `main_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 main_image：主图',
  `introduce_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 introduce_image：实测多为空串',
  `introduce` TEXT NULL COMMENT '源字段 productDetail.data.introduce：富文本 HTML',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：发行总量（实测 500/550668）',
  `flux` INT NOT NULL DEFAULT 0 COMMENT '源字段 flux：流通量（实测 550053）',
  `sale_total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 sale_total_num：已售数量（实测 137/0）',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：发行价（实测 0.00/100.00/1200.00）',
  `batch` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 sellInfo.data.product.batch：批次（实测 "2024"）',
  `collection_level` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 collection_level：实测全空串，不转 NULL',
  `issuer_id` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 issuer_id：发行方 ID（实测 0）',
  `creator_id` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 creator_id：创建方 ID（实测 0）',
  `publisher_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 publisher.name：发行方名（实测三种写法，源站不一致）',
  `publisher_logo` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 publisher.company_logo：发行方 Logo',
  `compound_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 compound_num：合成所需数量（实测 1）',
  `release_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 release_time：发行时间 unix 秒',
  `types` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 types：实测 1，语义未确认',
  `url_3d_type` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 3d_url_type：源字段名以数字开头，DB 列名改为 url_3d_type',
  `url_3d` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 3d_url：同上',
  `purchase_information` TEXT NULL COMMENT '源字段 purchase_information：实测为一串空格，清洗为 NULL',
  `is_img_diff` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_img_diff：实测 0',
  `is_lock` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_lock：1=锁定中',
  `weither_regift` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 weither_regift：1=允许转赠（实测为 0 才显示转赠按钮）',
  `weither_resale` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 weither_resale：1=允许寄售',
  `can_compose` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 can_compose：1=可合成',
  `is_like` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_like：1=已收藏',
  `is_sub` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_sub：1=已订阅',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_products_series_name` (`series_id`, `name`),
KEY `idx_products_series` (`series_id`),
KEY `idx_products_flux` (`flux` DESC),
KEY `idx_products_type` (`goods_type`),
KEY `idx_products_series_type` (`series_id`, `goods_type`),
  CONSTRAINT `fk_products_series_id` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 系列ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B2 products（藏品商品（发行主体））';

-- B3 product_pool_items：盲盒概率池
-- 源 API：productDetail / shopBoxDetail / shopCollectionDetail → collectionlist[]
DROP TABLE IF EXISTS `product_pool_items`;
CREATE TABLE `product_pool_items` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：概率池条目 ID',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：源站为纯嵌套数组无外键，所属盲盒',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：款式名',
  `probability` DECIMAL(6,3) NOT NULL DEFAULT 0.000 COMMENT '源字段 probability：实测两形态（数字 60.0 / 字符串 "12.5"），注意 shopBoxDetail 概率合计 23≠100，非简单概率',
  `show_total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 show_total_num：展示发行量',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：款式图',
  `rarity_icon` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 rarity_icon：稀有度图标',
  `is_out` TINYINT NULL COMMENT '源字段 is_out：1=已抽空（仅 productDetail 有此字段，shopBoxDetail 无，NULL）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_pool_product_name` (`product_id`, `name`),
KEY `idx_pool_product` (`product_id`),
  CONSTRAINT `fk_product_pool_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 商品ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B3 product_pool_items（盲盒概率池）';

-- B4 product_sale_rules：商品购买须知
-- 源 API：productRule.json
DROP TABLE IF EXISTS `product_sale_rules`;
CREATE TABLE `product_sale_rules` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：须知条目 ID',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属商品',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：条目名',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：价格',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：总量',
  `sale_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 sale_num：已售',
  `rule_updated` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 rule_updated：实测 "2026-10-16" 日期串',
  `rules` JSON NULL COMMENT '源字段 rules[]：{icon,title,lines[]} 整组存 JSON 不拆表（纯展示、icon/title/lines 强绑定）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_psr_product` (`product_id`),
  CONSTRAINT `fk_product_sale_rules_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 商品ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B4 product_sale_rules（商品购买须知）';

-- B5 user_collections：用户藏品实例（核心表）
-- 源 API：myCollectionDetail / myCollectionList / userCollectionList / blindBoxMyBox
DROP TABLE IF EXISTS `user_collections`;
CREATE TABLE `user_collections` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：藏品实例 ID（实测 77001/6001/5712041）',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 product.id / collection_id / goods_id（三处源字段名不同，同一语义）：所属商品，外键关联 products.id',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：源站列表接口不返回 user_id，按登录态归属',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：藏品名（源站直取）。【补列说明】此前未建此列，导致「我的藏品」列表只能 JOIN products.name 显示（恒为「赛博铁牛盲盒」），而源站 8 条实为「赛博铁牛/青川山水/赛博之神/赛博黑猫/天狗/赛博猫」等不同藏品名。本列存源站原值，展示优先于 products.name',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：藏品列表图（源站直取，与 products.listimg 可能不同）',
  `main_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 main_image：藏品主图（源站直取）',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：业务编号（实测 QC88231 / QC2026... / QC-2024-0031 / PBCE/...），裁决A 见 DATABASE.md §6.1',
  `collection_code_num` BIGINT NULL COMMENT '源字段 collection_code 的数值形态：承载 387750 类纯数值编号（裁决A 双列），不与 id 建 FK（不同 ID 空间）',
  `serial_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 serial_num：序号（实测 231）',
  `series_total` INT NOT NULL DEFAULT 0 COMMENT '源字段 series_total：系列总量（实测 500）',
  `user_hash` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 user_hash：链上哈希。源站语义不稳定（0x 地址/哈希串/已脱敏三形态），不加格式约束',
  `user_hash_text` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 user_hash_text：展示用脱敏值',
  `rz_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 rz_code：认证编号（实测两种类型 RZ-QC-226-0001 / 238166）',
  `status` SMALLINT NULL DEFAULT NULL COMMENT '源字段 status：E-COLLECTION-STATUS 1=持有中 2=寄售中 10=赠送中；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `is_lock` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_lock：1=锁定（与 product 级并存）',
  `weither_regift` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 weither_regift：实例级覆盖',
  `weither_resale` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 weither_resale：实例级覆盖',
  `can_compose` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 can_compose：实例级覆盖',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：当前售价',
  `min_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 min_price：最低价',
  `today_volume` INT NOT NULL DEFAULT 0 COMMENT '源字段 today_volume：今日成交量（实测 6）',
  `has_sold` INT NOT NULL DEFAULT 0 COMMENT '源字段 has_sold：已售数量（myCollectionList 独有，实测 0/1/2）',
  `count` INT NOT NULL DEFAULT 0 COMMENT '源字段 count：持有数量（列表接口独有）',
  `flux` INT NOT NULL DEFAULT 0 COMMENT '源字段 flux：系列流通量（列表冗余字段）',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：系列总量（列表冗余字段）',
  `zuzhao_info_id` BIGINT NULL COMMENT '源字段 zuzhao_info_id：铸造信息 ID（实测 null）',
  `task_id` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 task_id：实测 "7Ep3Gz2G5Eb8Vt2V"',
  `blind_box_id` BIGINT UNSIGNED NULL COMMENT '源字段 blindBoxMyBox.id：所属盲盒实例',
  `createtime` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：实例创建时间 unix 秒（我的藏品列表按此倒序）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_uc_code` (`collection_code`, `collection_code_num`),
KEY `idx_uc_user_product` (`user_id`, `product_id`),
KEY `idx_uc_status` (`status`),
KEY `idx_uc_product` (`product_id`, `status`),
KEY `idx_uc_user_createtime` (`user_id`, `createtime` DESC),
  CONSTRAINT `fk_user_collections_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 商品ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B5 user_collections（用户藏品实例（核心表））';

-- B5b user_blind_box_records：开盒记录流水
-- 源 API：blindBoxOpenRecord.json（/box/blind_box/openlog）
-- 【补建说明】该快照此前被 seed.py 以「无独立表承载」为由跳过（SKIP_MOCKS），
-- 导致开盒记录页只能从 user_collections 里取 blind_box_id 非空的行（库中仅 1 行，
-- 源站实测 5 条）。开盒记录是**历史流水事件**，与 user_collections（当前持有状态）
-- 语义不同，不应互相派生，故补建本表。
DROP TABLE IF EXISTS `user_blind_box_records`;
CREATE TABLE `user_blind_box_records` (
  `id` BIGINT UNSIGNED NOT NULL COMMENT '源字段 id：开盒记录 ID（源站实测 1~5，与 user_collections.id 不同域，不冲突）',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库；非 NULL 时保证存在于父表｜设计关联，非源站字段：源站按当前登录用户返回',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：由藏品名反查 products.name 得到，用于展示图',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 反查失败时留存藏品名原文',
  `blind_box_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供；仅建索引｜设计关联，非源站字段：由 box_name 反查盲盒产品得到',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：藏品图',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：产出藏品名（实测「青川·千里江山」等）',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：藏品编号（实测 "QC20261013000137"）',
  `rarity_icon` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 rarity_icon：稀有度图标（源站 openlog 快照中为 null）',
  `box_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 box_name：所属盲盒名（实测「青川·青绿山水盲盒」）',
  `createtime` BIGINT NULL DEFAULT 0 COMMENT '源字段 createtime：开盒时间 unix 秒（实测 1766500000 等）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_ubbr_user` (`user_id`, `createtime` DESC),
KEY `idx_ubbr_product` (`product_id`),
KEY `idx_ubbr_box` (`blind_box_id`),
  CONSTRAINT `fk_user_blind_box_records_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 用户ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B5b user_blind_box_records（开盒记录流水）';

-- B6 collection_flow_records：藏品流转记录
-- 源 API：flowDoc.json
DROP TABLE IF EXISTS `collection_flow_records`;
CREATE TABLE `collection_flow_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：流转记录 ID',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：实测 "QC-2024-0031" 断链格式',
  `user_id` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计关联，非源站字段：页面展示用 nickname',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 nickname：冗余存昵称（源站只给昵称不给 id）',
  `flow_time` BIGINT NULL DEFAULT 0 COMMENT '源字段 createtime：实测为字符串 "1758788129"，灌库 CAST',
  `source_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 source_type：实测 1~6 与 id 严格同步，疑为递增 ID 非类型枚举，不建枚举约束，待确认',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cfr_code` (`collection_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B6 collection_flow_records（藏品流转记录）';

-- B7 collection_price_ticks：成交价轨迹
-- 源 API：sellInfo.data.list[] / giftRecord.json
DROP TABLE IF EXISTS `collection_price_ticks`;
CREATE TABLE `collection_price_ticks` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜源字段 sellInfo.data.id：所属商品，外键关联 products.id',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：藏品编号',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：成交价',
  `num` INT NOT NULL DEFAULT 0 COMMENT '源字段 num：数量',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：实测 100/50/200',
  `tick_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 time：实测 "2026-10-15 14:22:10" 字符串，故用 VARCHAR',
  `sale_type` TINYINT NULL DEFAULT NULL COMMENT '设计新增，非源站字段：1=市场成交(sellInfo) 2=转赠(giftRecord)，两接口同构但语义不同；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cpt_product` (`product_id`),
KEY `idx_cpt_product_time` (`product_id`, `tick_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='B7 collection_price_ticks（成交价轨迹）';


-- ==========================================================================
-- C. 交易与订单域（6 张表）
-- ==========================================================================

-- C1 market_listings：市场寄售挂单（市场挂单与我的寄售为同一实体的不同视图）
-- 源 API：marketDetail / marketGoodsList / consignList / myConsignment
DROP TABLE IF EXISTS `market_listings`;
CREATE TABLE `market_listings` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：挂单 ID（实测 240472/7001/7002）',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 goods_id / product.id：挂单商品，外键关联 products.id',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `series_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜源字段 series_id：所属系列，外键关联 series.id',
  `series_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：series_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `series_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `collection_id` BIGINT UNSIGNED NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 sale_user_collection_id / user_collection.id：被卖藏品实例，外键关联 user_collections.id',
  `sale_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜源字段 sale_user_id：卖方，外键关联 users.id',
  `sale_user_nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 sale_user_nickname：冗余（实测已脱敏 db****）',
  `buy_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜源字段 buy_user_id：买方（实测 0=未成交）',
  `buy_user_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：buy_user_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `buy_user_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 goods_name / name：商品名称',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 goods_cover_image / listimg：封面图',
  `series_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 series_name：冗余系列名',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：实测三种形态（数字 15 / 字符串 "15.00" / "120.00"）',
  `min_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 marketGoodsList.min_price：专辑最低价',
  `status` TINYINT NULL DEFAULT NULL COMMENT '源字段 status：E-LISTING-STATUS 1=寄售中 2=已成交 3=已取消；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `goods_type` TINYINT NULL DEFAULT NULL COMMENT '源字段 goods_type：E-GOODS-TYPE-COLLECTION 藏品域 1=盲盒 2=单品（裁决C）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `income_type` VARCHAR(32) NULL COMMENT '源字段 income_type：E-INCOME-TYPE（裁决B：单值列，数字 1 保持 NULL 不映射）',
  `income_type_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：裁决B 原值留痕，存数组 ["huifu"] 或数字 "1"',
  `pay_way` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 myConsignment.pay_way：E-PAY-WAY（实测 huifu）',
  `order_sn` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 order_sn：实测 30 位数字串',
  `sale_time` BIGINT NULL COMMENT '源字段 sale_time：成交时间（实测 null）',
  `listing_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：上架时间 unix 秒',
  `update_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 updatetime：更新时间 unix 秒',
  `rush_status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 rush_status：实测 0，market/Detail.vue 有消费',
  `pay_platform_service_rate` DECIMAL(8,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 pay_platform_service_rate：实测 "0.05"',
  `platform_service_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 platform_service_price：实测 "0.75"',
  `creator_service_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 creator_service_price：实测 "0.00"',
  `real_income` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 real_income：卖家实收（实测 "14.25" = 15 - 0.75 - 0.00）',
  `buy_version` INT NOT NULL DEFAULT 0 COMMENT '源字段 buy_version：乐观锁版本号（实测 2）',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 deleted：实测 0',
  `pay_text` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 pay_text：实测 0',
  `img` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 marketDetail.img：图片',
  `name_ext` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 marketDetail.name（实测空串）：扩展名',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_ml_order_sn` (`order_sn`),
KEY `idx_ml_product_status` (`product_id`, `status`, `price`),
KEY `idx_ml_series` (`series_id`),
KEY `idx_ml_sale_user` (`sale_user_id`, `status`),
KEY `idx_ml_buy_user` (`buy_user_id`),
KEY `idx_ml_listing_time` (`listing_time` DESC),
KEY `idx_ml_buy_version` (`buy_version`),
KEY `idx_ml_sale_user_time` (`sale_user_id`, `listing_time` DESC),
  CONSTRAINT `fk_market_listings_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, -- 商品ID
  CONSTRAINT `fk_market_listings_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `user_collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 藏品实例ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C1 market_listings（市场寄售挂单（市场挂单与我的寄售为同一实体的不同视图））';

-- C2 orders：交易订单（买单侧；裁决D：order_status 按 order_type 分域）
-- 源 API：orderList.json / orderDetail.json
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：订单 ID（实测 9001）',
  `order_sn` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 order_sn：订单号（唯一）',
  `order_status` SMALLINT NOT NULL DEFAULT 0 COMMENT '源字段 order_status：E-ORDER-STATUS-BUY 买单域 0=已完成 1=待付款 2=进行中 3=已取消 4=已取消（裁决D：实测无 7，不臆造委托态）',
  `order_type` TINYINT NOT NULL DEFAULT 1 COMMENT '设计新增，非源站字段：1=买入(orderList) 2=卖出(myConsignment 同源)，依据 OrderList.vue L375',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 goods_id：订单商品，外键关联 products.id（权威归属，裁决A）',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `product_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 goods_name：商品名称',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：封面图',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code 的派生规范值：实测 "226" 实为 product_id 而非藏品编号（裁决A，见 §6.1）',
  `collection_code_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：裁决A 原值留痕，存源站错位原值 "226"，可追溯源站异常',
  `user_hash_text` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 user_hash_text：展示用脱敏哈希',
  `number` INT NOT NULL DEFAULT 0 COMMENT '源字段 number：数量（orderDetail 中与 num 同值 2，冗余）',
  `num` INT NOT NULL DEFAULT 0 COMMENT '源字段 num：数量',
  `sale_number` INT NOT NULL DEFAULT 0 COMMENT '源字段 sale_number：已售数量（实测 0/2/3）',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：单价',
  `total_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 total_price：总价',
  `order_amount` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 orderDetail.order_amount：订单金额（实测 "200.00"）',
  `discount_amount` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 orderDetail.discount_amount：优惠金额（实测 "0"）',
  `pay_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 orderDetail.pay_price：应付金额（实测 "200.00"）',
  `pay_way` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 pay_way：E-PAY-WAY 支付渠道',
  `pay_name` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 pay_name：支付渠道全称（实测「汇付天下」）',
  `income_type` VARCHAR(32) NULL COMMENT '源字段 income_type：E-INCOME-TYPE（裁决B：单值列，实测 "huifu"）',
  `income_type_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：裁决B 原值留痕',
  `goods_type` TINYINT NULL DEFAULT NULL COMMENT '源字段 goods_type（orderDetail 独有，实测 1）：E-GOODS-TYPE-COLLECTION 藏品域；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `remark` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 remark：备注（实测空串）',
  `card` JSON NULL COMMENT '源字段 card：支付凭证数组（实测 []）',
  `order_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：下单时间 unix 秒',
  `update_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 updatetime：更新时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计新增，非源站字段：下单用户，支撑「我的订单」查询（§7 idx_order_user_time）',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_orders_sn` (`order_sn`),
KEY `idx_order_user_status` (`order_type`, `order_status`, `order_time` DESC),
KEY `idx_order_product` (`product_id`),
KEY `idx_order_user_time` (`user_id`, `order_time` DESC),
  CONSTRAINT `fk_orders_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 商品ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C2 orders（交易订单（买单侧；裁决D：order_status 按 order_type 分域））';

-- C3 order_cards：订单支付凭证（骨架表，实测 card[] 为空数组）
-- 源 API：orderDetail.json → card[]（实测空，表结构预留）
DROP TABLE IF EXISTS `order_cards`;
CREATE TABLE `order_cards` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站 card[] 无 id',
  `order_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属订单，外键关联 orders.id',
  `card_no` VARCHAR(64) NULL COMMENT '设计预留，非源站字段：mock 中 card:[] 为空，字段名无从得知，不臆造，仅定义骨架',
  `bank` VARCHAR(64) NULL COMMENT '设计预留，非源站字段：同上',
  `amount` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '设计预留，非源站字段：同上',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_oc_order` (`order_id`),
  CONSTRAINT `fk_order_cards_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 订单ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C3 order_cards（订单支付凭证（骨架表，实测 card[] 为空数组））';

-- C4 entrust_orders：求购/委托单（独立表；裁决D：委托域 order_status 语义自成一套）
-- 源 API：entrustList.json / begList.json（两文件字节完全相同）
DROP TABLE IF EXISTS `entrust_orders`;
CREATE TABLE `entrust_orders` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：委托单 ID（实测 9101）',
  `order_sn` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 order_sn：委托单号',
  `order_status` SMALLINT NULL DEFAULT NULL COMMENT '源字段 order_status：E-ENTRUST-STATUS 委托域 2=委托中 3=已成交 4=已取消（裁决D：与买单域 3/4 语义冲突，不可共用枚举）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计新增，非源站字段：委托人，源站无该字段',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：源站无 goods_id，用 goods_name 匹配求购标的',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `goods_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 goods_name：求购标的名称（实测「赛博铁牛」）',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：封面图',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：实测 "QC88231"，本表为正常形态（非错位）',
  `number` INT NOT NULL DEFAULT 0 COMMENT '源字段 number：求购数量',
  `num` INT NOT NULL DEFAULT 0 COMMENT '源字段 num：数量',
  `sale_number` INT NOT NULL DEFAULT 0 COMMENT '源字段 sale_number：已售数量',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：求购单价',
  `total_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 total_price：求购总价',
  `pay_way` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 pay_way：E-PAY-WAY（实测 huifu）',
  `beg_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：求购发起时间 unix 秒',
  `update_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 updatetime：更新时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_entrust_sn` (`order_sn`),
KEY `idx_entrust_status` (`order_status`, `beg_time` DESC),
KEY `idx_entrust_product` (`product_id`),
KEY `idx_entrust_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C4 entrust_orders（求购/委托单（独立表；裁决D：委托域 order_status 语义自成一套））';

-- C5 trade_unions：交易联盟配置（单行配置）
-- 源 API：tradeUnion.json / getConfig.json → data.trade_union
DROP TABLE IF EXISTS `trade_unions`;
CREATE TABLE `trade_unions` (
  `id` INT UNSIGNED NULL COMMENT '设计新增，非源站字段：单行配置固定 1',
  `unlock` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 unlock：实测 false，统一转 0/1',
  `member_count` INT NOT NULL DEFAULT 0 COMMENT '源字段 member_count：成员数',
  `rebate_holder` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '源字段 rebate_holder：实测 "1.88"',
  `rebate_invited` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '源字段 rebate_invited：实测 "1"',
  `rebate_extra` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '源字段 rebate_extra：实测 "0.88"',
  `max_bind` INT NOT NULL DEFAULT 0 COMMENT '源字段 max_bind：实测 30',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C5 trade_unions（交易联盟配置（单行配置））';

-- C6 kline_snapshots：行情快照
-- 源 API：klineInfo.json
DROP TABLE IF EXISTS `kline_snapshots`;
CREATE TABLE `kline_snapshots` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：源站仅给 name/series_name',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `product_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：商品名称（实测「凤吹晚霞」）',
  `series_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 series_name：系列名（实测「比太」）',
  `price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 price：实测 "112.34"',
  `change` VARCHAR(16) NULL COMMENT '源字段 change：实测 "-0.53%" 带百分号字符串，故用 VARCHAR',
  `increase` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 increase：实测 false，涨跌方向',
  `flux` INT NOT NULL DEFAULT 0 COMMENT '源字段 num.flux：实测字符串 "30000"',
  `deal_5min` INT NOT NULL DEFAULT 0 COMMENT '源字段 num.deal_5min：5 分钟成交',
  `deal_1h` INT NOT NULL DEFAULT 0 COMMENT '源字段 num.deal_1h：1 小时成交',
  `deal_today` INT NOT NULL DEFAULT 0 COMMENT '源字段 num.deal_today：今日成交',
  `high_24h` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 num.high_24h：24 小时最高',
  `low_24h` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 num.low_24h：24 小时最低',
  `asks` JSON NULL COMMENT '源字段 asks[]：{price,num,total} 卖档，整组存 JSON 不拆表',
  `bids` JSON NULL COMMENT '源字段 bids[]：买档，整组存 JSON 不拆表',
  `deals` JSON NULL COMMENT '源字段 deals[]：{time,price,num,total} 成交明细，整组存 JSON 不拆表',
  `snapshot_time` BIGINT NOT NULL DEFAULT 0 COMMENT '设计新增，非源站字段：快照时刻 unix 秒，用于时序留存',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_kline_product_time` (`product_id`, `snapshot_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='C6 kline_snapshots（行情快照）';


-- ==========================================================================
-- D. 活动与玩法域（14 张表）
-- ==========================================================================

-- D1 activities：精选活动
-- 源 API：activeSelectedList.json
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：活动 ID',
  `title` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 title：活动标题',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：活动图',
  `type` TINYINT NULL DEFAULT NULL COMMENT '源字段 type：E-ACTIVITY-TYPE 1=合成 2=抽奖转盘 3=盲盒 4=签到（route 反查确认）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `start_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 start_time：实测 "2026-12-01 10:00:00" 字符串，故用 VARCHAR',
  `end_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 end_time：同上',
  `join_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 join_num：参与人数',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 status：实测全 1',
  `qualify` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 qualify：参与门槛文案',
  `route` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 route：跳转路径（type 枚举的实证依据）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D1 activities（精选活动）';

-- D2 compound_schemes：合成方案
-- 源 API：compoundList.json / compoundScheme.json
DROP TABLE IF EXISTS `compound_schemes`;
CREATE TABLE `compound_schemes` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：方案 ID',
  `play_id` INT NOT NULL DEFAULT 0 COMMENT '源字段 play_id：玩法 ID（实测 201/202/203）',
  `title` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 title：方案标题',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：方案图',
  `target_img` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 target_img：目标合成图',
  `start_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 start_time：unix 秒（与 D1 不同，此处为数值）',
  `end_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 end_time：unix 秒',
  `join_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 join_num：参与人数',
  `qualify` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 qualify：参与门槛文案',
  `rule_url` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 rule_url：规则图 URL',
  `rule_text` JSON NULL COMMENT '源字段 compoundScheme.data.rule_text[]：规则文本，整组存 JSON',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D2 compound_schemes（合成方案）';

-- D3 compound_scheme_items：合成材料清单
-- 源 API：compoundScheme.json → data.rule_text[].collectionList[]
DROP TABLE IF EXISTS `compound_scheme_items`;
CREATE TABLE `compound_scheme_items` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：材料条目 ID（实测 501/502/503）',
  `scheme_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属方案，外键关联 compound_schemes.id（源站为嵌套数组经 play_id 匹配）',
  `condition_name` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 name：条件名（实测「条件1」「条件2」）',
  `need_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 number：所需数量（实测 2/1）',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：实测 "QC20261013000137"（日期流水号体系）',
  `collection_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：材料藏品名',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：发行量',
  `image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 image：材料图',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_csi` (`scheme_id`, `collection_code`),
KEY `idx_csi_scheme` (`scheme_id`),
  CONSTRAINT `fk_compound_scheme_items_scheme_id` FOREIGN KEY (`scheme_id`) REFERENCES `compound_schemes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 合成方案ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D3 compound_scheme_items（合成材料清单）';

-- D4 user_compound_records：用户合成记录
-- 源 API：compoundRecord.json
DROP TABLE IF EXISTS `user_compound_records`;
CREATE TABLE `user_compound_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：合成记录 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：合成用户',
  `scheme_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属方案（title 匹配 compoundList.title），外键关联 compound_schemes.id',
  `title` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 title：方案标题（冗余）',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：方案图',
  `materials` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 materials：展示串（实测 "青川·宋画风华 ×2"）',
  `method` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 method：实测全 1，语义未确认',
  `consume` JSON NULL COMMENT '源字段 consume[]：{name,collection_code,total_num,image} 材料数组，整组存 JSON',
  `record_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 create_time：合成时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_ucr_user` (`user_id`),
KEY `idx_ucr_scheme` (`scheme_id`),
  CONSTRAINT `fk_user_compound_records_scheme_id` FOREIGN KEY (`scheme_id`) REFERENCES `compound_schemes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 合成方案ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D4 user_compound_records（用户合成记录）';

-- D5 compound_results：合成产出（三种异质产出混在一个数组，用 result_type 区分）
-- 源 API：compoundResult.json → data.result[]
DROP TABLE IF EXISTS `compound_results`;
CREATE TABLE `compound_results` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站 result 项无 id',
  `record_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属合成记录，外键关联 user_compound_records.id',
  `result_type` VARCHAR(8) NOT NULL DEFAULT '' COMMENT '源字段 type：E-COMPOUND-RESULT 字符串枚举 C=合集藏品 M=材料 S=龙晶积分（实测三值）',
  `name` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 name：产出名称',
  `user_collection_code` VARCHAR(64) NULL COMMENT '源字段 user_collection_code：仅 C 类携带',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：仅 C 类携带（实测 888）',
  `number` INT NOT NULL DEFAULT 0 COMMENT '源字段 number：仅 M 类携带（实测 3）',
  `crystal_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 crystal_type：仅 S 类携带（实测 1）',
  `single_quantity` INT NOT NULL DEFAULT 0 COMMENT '源字段 single_quantity：仅 S 类携带（实测 1200）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cr_record` (`record_id`),
  CONSTRAINT `fk_compound_results_record_id` FOREIGN KEY (`record_id`) REFERENCES `user_compound_records` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 合成记录ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D5 compound_results（合成产出（三种异质产出混在一个数组，用 result_type 区分））';

-- D6 lottery_rounds：抽奖轮次
-- 源 API：lotteryInfo.json / lotteryRule.json
DROP TABLE IF EXISTS `lottery_rounds`;
CREATE TABLE `lottery_rounds` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `end_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 end_time：结束时间 unix 秒',
  `prizes` JSON NULL COMMENT '源字段 prizeList[]：{id,name,lottery_image} × 6，纯展示配置，整组存 JSON',
  `consume` JSON NULL COMMENT '源字段 consume[]：{id,name,collection_code,total_num,image,number} 消耗项，整组存 JSON',
  `rule` TEXT NULL COMMENT '源字段 lotteryRule.json → data.rule：富文本规则',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D6 lottery_rounds（抽奖轮次）';

-- D7 user_lottery_records：抽奖记录
-- 源 API：lotteryRecord.json
DROP TABLE IF EXISTS `user_lottery_records`;
CREATE TABLE `user_lottery_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：抽奖记录 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：抽奖用户',
  `prize_name` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 name：奖品名（含积分奖品如「龙晶 1200」混在此字段）',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：奖品图',
  `prize_kind` TINYINT NULL DEFAULT NULL COMMENT '设计新增，非源站字段：1=藏品 2=龙晶，依据 name 内嵌数量文本判定；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `record_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 create_time：抽奖时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_ulr_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D7 user_lottery_records（抽奖记录）';

-- D8 draw_codes：抽签码
-- 源 API：activityDraw.json → data.code_list[] / win_code_list[]
DROP TABLE IF EXISTS `draw_codes`;
CREATE TABLE `draw_codes` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：抽签码 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：所属用户',
  `code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 code：抽签码（实测 QC-DRAW-3827-A1 / QC-WIN-2026-00871）',
  `code_type` TINYINT NULL DEFAULT NULL COMMENT '设计新增，非源站字段：1=抽签码(code_list) 2=中签码(win_code_list)，依据所属数组',
  `create_time_str` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 create_time：实测 "2026-12-01 10:12:03" 字符串',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
UNIQUE KEY `uk_draw_code` (`code`),
KEY `idx_dc_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D8 draw_codes（抽签码）';

-- D9 user_draw_records：抽签记录
-- 源 API：activityRecord.json
DROP TABLE IF EXISTS `user_draw_records`;
CREATE TABLE `user_draw_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：抽签记录 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：抽签用户',
  `draw_sn` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 draw_sn：抽签序列号',
  `draw_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 draw_time：实测字符串',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 status：E-DRAW-STATUS 0=未中签/待定 1=已中签 2=未中签（实测 1/2/0）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_udr_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D9 user_draw_records（抽签记录）';

-- D10 sign_reward_rules：签到奖励规则
-- 源 API：signInfo.json → data.reward_list[]
DROP TABLE IF EXISTS `sign_reward_rules`;
CREATE TABLE `sign_reward_rules` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `day` INT NOT NULL DEFAULT 0 COMMENT '源字段 reward_list[].day：签到天数（实测 1~7）',
  `crystal` INT NOT NULL DEFAULT 0 COMMENT '源字段 reward_list[].crystal：奖励龙晶（实测 10/20/30/40/50/60/100）',
  `sign_rule` TEXT NULL COMMENT '源字段 data.sign_rule：签到规则富文本',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_srr_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D10 sign_reward_rules（签到奖励规则）';

-- D11 user_sign_status：用户签到状态
-- 源 API：signInfo.json → data.user_info
DROP TABLE IF EXISTS `user_sign_status`;
CREATE TABLE `user_sign_status` (
  `user_id` BIGINT UNSIGNED NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；灌库不做存在性约束｜设计关联，非源站字段：源站为用户状态对象，按登录态归属，一人一签到主键（PK 本身即索引）',
  `continuous_days` INT NOT NULL DEFAULT 0 COMMENT '源字段 continuous_days：连续签到天数（实测 3），断签归零',
  `sign_days` JSON NULL COMMENT '源字段 sign_days：本轮已签天数（实测 [1,2,3]）',
  `sign_status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 sign_status：0=今日未签 1=今日已签（推断，依据页面签到按钮态）',
  `crystal_number` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 crystal_number：龙晶余额（实测 2860）。权威位置应为 users，但 users 的 mock 无此字段，暂承载于此（遗留项见 §10）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D11 user_sign_status（用户签到状态）';

-- D12 shop_goods：积分商城商品（裁决C：goods_type 使用商城域枚举，与藏品域严禁混用）
-- 源 API：shopList.json → data.list[] / shopGoodsDetail / shopBoxDetail / shopCollectionDetail → data.info
DROP TABLE IF EXISTS `shop_goods`;
CREATE TABLE `shop_goods` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 goods_id / info.id：商城商品 ID（实测 101~106）',
  `name` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 goods_name：商品名称',
  `list_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 list_image：商品图',
  `crystal_price` INT NOT NULL DEFAULT 0 COMMENT '源字段 crystal_price：兑换所需龙晶（实测 1200/880/2400），整型龙晶点数非金额',
  `exchange_status` TINYINT NULL DEFAULT NULL COMMENT '源字段 exchange_status：E-EXCHANGE-STATUS 1=未开售 2=立即兑换 4=已兑完 5=龙晶不足（3 预留未出现）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：总量',
  `exchange_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 exchange_num：已兑换数',
  `goods_type` TINYINT NULL DEFAULT NULL COMMENT '源字段 goods_type：E-GOODS-TYPE-SHOP 商城域 1=数字藏品 2=盲盒 3=合集（裁决C：实测 101→1/102→2/103→3）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `end_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 end_time：结束时间 unix 秒',
  `max_count` INT NOT NULL DEFAULT 0 COMMENT '源字段 info.max_count：限购数（实测 5）',
  `is_sub` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 info.is_sub：实测 false，统一转 0/1',
  `count_down` INT NOT NULL DEFAULT 0 COMMENT '源字段 info.count_down：倒计时秒（实测 86400）',
  `shop_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 info.type：实测 10，语义未确认',
  `details` TEXT NULL COMMENT '源字段 info.details / product.details：富文本详情',
  `crystal_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 info.crystal_type：龙晶类型（实测 1）',
  `pool_items` JSON NULL COMMENT '源字段 shopBoxDetail.product.collectionlist[]：概率池，整组存 JSON',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_sg_type` (`goods_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D12 shop_goods（积分商城商品（裁决C：goods_type 使用商城域枚举，与藏品域严禁混用））';

-- D13 user_shop_exchanges：兑换记录（order_id 与 orders.id 同 ID 空间，复用订单表）
-- 源 API：shopExchangeRecord.json
DROP TABLE IF EXISTS `user_shop_exchanges`;
CREATE TABLE `user_shop_exchanges` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：兑换记录 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：兑换用户',
  `order_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 order_id：兑换单 ID（实测 9001~9004，与 orders.id 同空间），外键关联 orders.id',
  `goods_name` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 goods_name：商品名称',
  `list_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 list_image：商品图',
  `crystal_number` INT NOT NULL DEFAULT 0 COMMENT '源字段 crystal_number：消耗龙晶（实测 880/1200/2400/3600）',
  `crystal_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 crystal_type：实测 1/2 两种，与 shop_goods.crystal_type 不同域',
  `create_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 create_time：兑换时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_use_user` (`user_id`),
KEY `idx_use_user_time` (`user_id`, `create_time` DESC),
KEY `idx_use_order` (`order_id`),
  CONSTRAINT `fk_user_shop_exchanges_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 订单ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D13 user_shop_exchanges（兑换记录（order_id 与 orders.id 同 ID 空间，复用订单表））';

-- D14 user_crystal_logs：龙晶流水
-- 源 API：shopCrystalDetail.json
DROP TABLE IF EXISTS `user_crystal_logs`;
CREATE TABLE `user_crystal_logs` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：流水 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：流水所属用户',
  `model` TINYINT NULL DEFAULT NULL COMMENT '源字段 model：流水方向 1=支出 2=收入（实测：model:1 全为「兑换…×N」扣龙晶，model:2 对应大额收入，高置信推断）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `memo` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 memo：展示文本（实测 "兑换青川·青绿山水盲盒 ×1"），具备描述性故保留',
  `crystal` INT NOT NULL DEFAULT 0 COMMENT '源字段 crystal：变动数量（实测 880/1200/4800/3600）',
  `log_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：变动时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_crystal_user` (`user_id`, `log_time` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='D14 user_crystal_logs（龙晶流水）';


-- ==========================================================================
-- E. 内容与社区域（10 张表）
-- ==========================================================================

-- E1 community_posts：社区动态（裁决E：create_time_str 保持 VARCHAR，不补全年份）
-- 源 API：wallDetails.json
DROP TABLE IF EXISTS `community_posts`;
CREATE TABLE `community_posts` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：动态 ID',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：发布者（源站仅给 profile.nickname）',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 profile.nickname：发布者昵称（冗余）',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 profile.avatar：发布者头像（冗余）',
  `content` TEXT NULL COMMENT '源字段 content：动态正文',
  `create_time_str` VARCHAR(32) NULL COMMENT '源字段 create_time：实测 "10-16 09:24" 缺年份。裁决E：不补全年份（属数据伪造），保持 VARCHAR',
  `images` JSON NULL COMMENT '源字段 images[]：图片数组（实测 3 张，顺序有语义），整组存 JSON',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cp_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E1 community_posts（社区动态（裁决E：create_time_str 保持 VARCHAR，不补全年份））';

-- E2 community_comments：动态评论（两级，自关联实现二级回复）
-- 源 API：wallDetails.json → data.comment_list[] 及其 reply[]
DROP TABLE IF EXISTS `community_comments`;
CREATE TABLE `community_comments` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：评论 ID（实测 7001/7002/7003）',
  `post_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：所属动态，外键关联 community_posts.id',
  `parent_id` BIGINT UNSIGNED NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 reply_id：顶层评论 reply_id=0 存 NULL，二级指向父评论 id，自关联外键关联 community_comments.id',
  `content` TEXT NULL COMMENT '源字段 content：评论正文',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 profile.nickname：评论者昵称',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 profile.avatar：评论者头像',
  `reply_nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 reply_profile.nickname：被回复者昵称（实测顶层评论中 reply_profile == profile）',
  `reply_avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 reply_profile.avatar：被回复者头像',
  `has_more` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 has_more：实测 false，是否还有更多回复',
  `create_time_str` VARCHAR(32) NULL COMMENT '源字段 create_time：实测 "10-16 09:41"，同 E1，裁决E 不补全年份',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cc_post` (`post_id`, `parent_id`, `id`),
KEY `idx_cc_parent` (`parent_id`),
  CONSTRAINT `fk_community_comments_post_id` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE, -- 动态ID
  CONSTRAINT `fk_community_comments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `community_comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 父评论ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E2 community_comments（动态评论（两级，自关联实现二级回复））';

-- E3 community_share_records：社区推广记录
-- 源 API：communityShare.json → data.share_records[]
DROP TABLE IF EXISTS `community_share_records`;
CREATE TABLE `community_share_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：推广记录 ID',
  `community` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 community：社区标识',
  `create_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 create_time：实测字符串，故用 VARCHAR',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E3 community_share_records（社区推广记录）';

-- E5 chat_sessions：聊天会话（源站无会话实体，为挂载消息所必需）
-- 源 API：chatMessages.json（设计新增实体）
DROP TABLE IF EXISTS `chat_sessions`;
CREATE TABLE `chat_sessions` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无会话 ID',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '设计新增，非源站字段：会话名（实测群名「敦煌守夜人」等散落在 nickname）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E5 chat_sessions（聊天会话（源站无会话实体，为挂载消息所必需））';

-- E4 chat_messages：聊天消息
-- 源 API：chatMessages.json
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：消息 ID',
  `session_id` BIGINT UNSIGNED NULL DEFAULT 1 COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：源站无会话概念，按单群固定值 1，外键关联 chat_sessions.id',
  `is_self` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_self：实测 true/false，是否本人发送（源站直接返回故保留）',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：发送者，外键关联 users.id',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 nickname：发送者昵称',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 avatar：发送者头像',
  `content` TEXT NULL COMMENT '源字段 content：消息内容',
  `date_text` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 date_text：实测 "2026-10-16 14:22"',
  `show_date` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 show_date：实测 true，前端时间分隔条显隐开关，属 UI 状态非业务数据，保留以还原列表',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_cm_session` (`session_id`, `id`),
KEY `idx_cm_user` (`user_id`),
  CONSTRAINT `fk_chat_messages_session_id` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 会话ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E4 chat_messages（聊天消息）';

-- E6 news_articles：资讯文章
-- 源 API：newsDetails.json
DROP TABLE IF EXISTS `news_articles`;
CREATE TABLE `news_articles` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：文章 ID',
  `title` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 title：文章标题',
  `content` TEXT NULL COMMENT '源字段 content：富文本正文',
  `publish_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 createtime：发布时间 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E6 news_articles（资讯文章）';

-- E7 affiche_types：公告类型
-- 源 API：affichetypelist.json
DROP TABLE IF EXISTS `affiche_types`;
CREATE TABLE `affiche_types` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：类型 ID（实测 7 条：1官方 2运营 3寄售 4限价 5求购 6活动 7空投）',
  `name` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 name：类型名',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E7 affiche_types（公告类型）';

-- E8 affiches：公告
-- 源 API：afficheList.json / index_afficheList.json / noticeDetails.json
DROP TABLE IF EXISTS `affiches`;
CREATE TABLE `affiches` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：公告 ID（实测 434/443/445）',
  `title` VARCHAR(255) NULL DEFAULT '' COMMENT '源字段 title：公告标题',
  `image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 image：公告图（实测空串）',
  `url` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 url：跳转链接（实测空串）',
  `type` VARCHAR(16) NULL DEFAULT '' COMMENT '源字段 type：实测字符串 "1"，冗余关联 affiche_types.id',
  `affiche_type` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 affiche_type：类型中文名（实测「寄售公告」），关联 affiche_types.name',
  `view_count` INT NOT NULL DEFAULT 0 COMMENT '源字段 view_count：列表实测 0 / 详情实测 1286，以详情值为准',
  `publish_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 noticeDetails.publish_time：实测 "2026-10-16 10:00:00" 字符串',
  `publish_time_ts` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 noticeDetails.createtime：发布时间 unix 秒（支撑列表排序索引）',
  `content` TEXT NULL COMMENT '源字段 noticeDetails.content：公告正文',
  `related_products` JSON NULL COMMENT '源字段 noticeDetails.collection[]：{id,name,listimg,price} × 3 相关藏品，整组存 JSON',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_affiches` (`type`, `publish_time_ts` DESC),
KEY `idx_affiches_time` (`publish_time_ts` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E8 affiches（公告）';

-- E9 banners：首页轮播
-- 源 API：banner_show_getBanner.json
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：轮播 ID',
  `image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 image：轮播图',
  `url` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 url：跳转链接',
  `url_type` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 url_type：实测 1',
  `is_show` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_show：实测 1，是否展示',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_bn_show` (`is_show`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E9 banners（首页轮播）';

-- E10 diypage_components：装修组件
-- 源 API：diypage.json / https:__api...diypage_index.json（两文件内容等价）
DROP TABLE IF EXISTS `diypage_components`;
CREATE TABLE `diypage_components` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：组件 ID（实测 3037~3042）',
  `type` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 type：E-DIYPAGE-TYPE 实测 menu/centre/popup/tabbar/user/float-button',
  `category` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 category：实测 home/popup/tabbar/user/float-button',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：组件名',
  `content` TEXT NULL COMMENT '源字段 content：JSON 字符串，内含前端布局 DSL，必须原样存 TEXT 不做结构化',
  `decorate_id` INT NOT NULL DEFAULT 0 COMMENT '源字段 decorate_id：装修模板 ID（实测全 2）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_dp_decorate` (`decorate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='E10 diypage_components（装修组件）';


-- ==========================================================================
-- F. 数据统计与分销域（5 张表）
-- ==========================================================================

-- F1 product_market_stats：藏品行情统计（marketList / marketCapRanking / leaderboard 归并）
-- 源 API：marketList.json / market_market_getMarketList.json / marketCapRanking.json / leaderboard.json
DROP TABLE IF EXISTS `product_market_stats`;
CREATE TABLE `product_market_stats` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜源字段 id：商品 ID，外键关联 products.id',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 name：商品名称（冗余）',
  `listimg` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 listimg：商品图（冗余）',
  `series_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜源字段 series_id：所属系列，外键关联 series.id',
  `series_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：series_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `series_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `goods_type` TINYINT NULL DEFAULT NULL COMMENT '源字段 goods_type：实测字符串 "2"，E-GOODS-TYPE-COLLECTION 藏品域（裁决C）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `total_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 total_num：发行总量',
  `flux` INT NOT NULL DEFAULT 0 COMMENT '源字段 flux：流通量（实测字符串 "550053"）',
  `min_price` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 min_price：最低价（实测 15 / "1234.00" 混合）',
  `deal_num` INT NOT NULL DEFAULT 0 COMMENT '源字段 deal_num：成交数（实测 0/1）',
  `market_value` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 market_value：市值 = 最新价 × 流通量（实测 8250795）',
  `market_fluctuate` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '源字段 market_fluctuate：涨跌幅 %（实测 -25 / 46.67）',
  `market_fluctuate_new` DECIMAL(8,2) NOT NULL DEFAULT 0.00 COMMENT '源字段 market_fluctuate_new：新涨跌幅（实测 50 / 72.73）',
  `reprice_limit` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 reprice_limit：寄售限价（实测 "20.00"）',
  `is_out` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 is_out：是否售罄（实测 0/1）',
  `flag` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 flag：实测 0',
  `select_status` TINYINT NOT NULL DEFAULT 0 COMMENT '源字段 select_status：实测 0',
  `collection_level` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 collection_level：实测空串，不转 NULL',
  `openresale_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 openresale_time：开放寄售时间 unix 秒（与 new_time 实测完全相同）',
  `new_time` BIGINT NOT NULL DEFAULT 0 COMMENT '源字段 new_time：上新时间 unix 秒',
  `stat_date` DATE NULL COMMENT '设计新增，非源站字段：快照日期，配合 product_id 定位时点',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_pms_product` (`product_id`, `stat_date` DESC),
KEY `idx_pms_series` (`series_id`, `flux` DESC),
KEY `idx_pms_mv` (`market_value` DESC),
KEY `idx_pms_flux` (`flux` DESC),
  CONSTRAINT `fk_product_market_stats_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 商品ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='F1 product_market_stats（藏品行情统计（marketList / marketCapRanking / leaderboard 归并））';

-- F2 rank_snapshots：用户榜单快照（五榜统一表 + rank_type 维度）
-- 源 API：leaderboardUser / masterRank / userBuyRank / drawLeaderboard / rebateLeaderboard
DROP TABLE IF EXISTS `rank_snapshots`;
CREATE TABLE `rank_snapshots` (
  `id` BIGINT UNSIGNED NULL COMMENT '设计新增，非源站字段：源站无 id',
  `rank_type` VARCHAR(32) NOT NULL DEFAULT '' COMMENT '设计新增，非源站字段：E-RANK-TYPE user_buy/master/product_buy/draw/rebate',
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：上榜用户，外键关联 users.id',
  `product_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站接口未返回该 ID（实测出现 0 哨兵或悬空 ID），ID 不保证存在于父表；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：仅 product_buy 榜有，外键关联 products.id',
  `product_id_raw` VARCHAR(64) NULL COMMENT '设计新增，非源站字段：product_id 源站原值留痕（含 0 哨兵与悬空 ID）；有效值写入 `product_id`，无效值本列为 "0"/原字符串，NULL 表示源站确未提供',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 nickname：上榜者昵称',
  `avatar` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 avatar：上榜者头像',
  `score` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 yao_count / num / total_price / nums / com_price：度量值统一为 score，语义由 rank_type 决定',
  `secondary_score` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 leaderboardUser.buy_collection_total_price：次级度量',
  `count` INT NOT NULL DEFAULT 0 COMMENT '源字段 userBuyRank.count：次数（实测 328）',
  `event_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 createtime：实测 "2026-10-16 14:22:10" 字符串',
  `payload` JSON NULL COMMENT '设计新增，非源站字段：承载各榜单特有字段（如 leaderboardUser.my）',
  `snapshot_time` BIGINT NOT NULL DEFAULT 0 COMMENT '设计新增，非源站字段：快照时刻 unix 秒',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_rank` (`rank_type`, `score` DESC),
KEY `idx_rank_user` (`user_id`),
KEY `idx_rank_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='F2 rank_snapshots（用户榜单快照（五榜统一表 + rank_type 维度））';

-- F3 rebate_profiles：分销返佣概况
-- 源 API：rebate.json → data.c_info
DROP TABLE IF EXISTS `rebate_profiles`;
CREATE TABLE `rebate_profiles` (
  `user_id` BIGINT UNSIGNED NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；灌库不做存在性约束｜设计关联，非源站字段：用户 ID 为主键，一人一概况（PK 本身即索引）',
  `all_commision` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 all_commision（源站拼写错误，正确为 commission，按铁律保留原名）：累计佣金（实测 "1286.40"）',
  `yesterday_commision` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 yesterday_commision（源站拼写错误）：昨日佣金（实测 "86.40"）',
  `user_transaction` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 user_transaction：名下用户总交易额（实测 "86420.00"）',
  `mingxia_commision` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 mingxia_commision（源站拼音错误，疑似「明下佣金」=下级佣金）：实测 "6420.00"',
  `yao_counts` INT NOT NULL DEFAULT 0 COMMENT '源字段 yao_counts（实测字符串 "36"）：有效邀请人数',
  `you_yao_counts` INT NOT NULL DEFAULT 0 COMMENT '源字段 you_yao_counts（实测字符串 "28"）：直推人数',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='F3 rebate_profiles（分销返佣概况）';

-- F4 rebate_invites：邀请关系与业绩
-- 源 API：rebateInviteDetail.json
DROP TABLE IF EXISTS `rebate_invites`;
CREATE TABLE `rebate_invites` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：邀请记录 ID',
  `inviter_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：邀请人，外键关联 users.id',
  `invitee_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：被邀请人（源站仅给 nickname），外键关联 users.id',
  `nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 nickname：被邀请人昵称',
  `join_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 jointime：实测 "2026-09-12" 日期串',
  `first_transaction_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 first_transaction_time：实测 "2026-09-15"，可空',
  `user_transaction` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 user_transaction：累计交易额',
  `month_transaction` DECIMAL(18,4) NOT NULL DEFAULT 0.0000 COMMENT '源字段 month_transaction：当月交易额（实测 28640.00）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_ri_inviter` (`inviter_id`, `month_transaction` DESC),
KEY `idx_ri_invitee` (`invitee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='F4 rebate_invites（邀请关系与业绩）';

-- F5 regift_records：转赠记录
-- 源 API：regiftRecord.json
DROP TABLE IF EXISTS `regift_records`;
CREATE TABLE `regift_records` (
  `id` BIGINT UNSIGNED NULL COMMENT '源字段 id：转赠记录 ID',
  `collection_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【强 FK】NULL=源站未提供或父记录不在库（灌库层校验后置 NULL）；非 NULL 时保证存在于父表｜设计关联，非源站字段：转赠的藏品实例，外键关联 user_collections.id',
  `collection_code` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 collection_code：实测 "PBCE/2000000000000001"（链上凭证体系，裁决A 前缀天然区分）',
  `product_name` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 goods_name：藏品名称',
  `cover_image` VARCHAR(512) NULL DEFAULT '' COMMENT '源字段 goods_cover_image：封面图',
  `from_user_id` BIGINT UNSIGNED NULL DEFAULT NULL COMMENT '【弱引用·不建 FK】NULL=源站未提供或该用户未被收录（源站仅暴露登录用户与 marketDetail 卖家，实测 users 仅 2 条：4930/22291），ID 不保证存在于 users.id；仅建索引，灌库不做存在性约束｜设计关联，非源站字段：转出方（源站给 from_user 昵称），外键关联 users.id',
  `from_user_nickname` VARCHAR(128) NULL DEFAULT '' COMMENT '源字段 from_user：转出方昵称',
  `status` TINYINT NULL DEFAULT NULL COMMENT '源字段 status：E-REGIFT-STATUS 1=待接收 2=已接收 3=已退回（全部枚举中可信度最高，有 status_text 直接佐证）；0 不在本枚举取值范围内（DEFAULT NULL，NULL=源站未提供）',
  `status_text` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 status_text（实测「待接收」「已接收」「已退回」）：前端直接渲染且源站文案可能扩展，故冗余保留',
  `order_no` VARCHAR(64) NULL DEFAULT '' COMMENT '源字段 order_no：实测 19 位数字串',
  `create_time_str` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 create_time：实测 "2026-10-16 09:09"',
  `back_time` VARCHAR(32) NULL DEFAULT '' COMMENT '源字段 back_time：实测 "1812061059386431" 是雪花 ID 不是时间戳，CAST 会得荒谬值，故用 VARCHAR（实测空串）',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`id`),
KEY `idx_rr_collection` (`collection_id`),
KEY `idx_rr_from_user` (`from_user_id`),
KEY `idx_rr_status` (`status`),
  CONSTRAINT `fk_regift_records_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `user_collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE -- 藏品实例ID
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='F5 regift_records（转赠记录）';


-- ==========================================================================
-- G. 转赠与配置域（2 张表）
-- ==========================================================================

-- G1 app_configs：平台配置 KV（v1.2 修订：主键改复合 (config_group, config_key)）
-- 源 API：getConfig.json / index_getConfig.json
-- 【v1.2 修订理由】原 v1.1 用 config_key 单列主键，但源站两份 getConfig 在basic 与
--   trade 分组下都有 appName 字段（实测值不同：「青川」/「青川数字艺术」），单列主键
--   会让后者的INSERT 触发唯一键冲突、或被后写覆盖。单列主键语义下按 config_key = appName（裸值，无引号）
--   直查也无法确定取哪个分组的值。改为复合主键后，(group,key) 唯一定位一条配置，
--   直查 appName 必须显式带 config_group，杜绝歧义。
DROP TABLE IF EXISTS `app_configs`;
CREATE TABLE `app_configs` (
  `config_group` VARCHAR(32) NOT NULL DEFAULT 'basic' COMMENT '设计新增，非源站字段：basic(index_getConfig) / trade(getConfig)，复合主键第一段。两者 appName 实测不同（「青川」与「青川数字艺术」），按组隔离防覆盖',
  `config_key` VARCHAR(128) NOT NULL COMMENT '设计新增，非源站字段：源站为 JSON 对象无键名，取字段名作 key；复合主键第二段。单独用 config_key 直查不唯一（basic/trade 均有 appName），必须带 config_group',
  `config_value` TEXT NULL COMMENT '源站各字段值：basic 组含 appName/appLogo/app_version/default_pay_type 等约 20 项（仅收录有值项），trade 组含 rate/share_proportion_rate/trade_rule 等',
  `value_type` VARCHAR(16) NULL DEFAULT 'string' COMMENT '设计新增，非源站字段：string/int/json/bool',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`config_group`, `config_key`),
KEY `idx_ac_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='G1 app_configs（平台配置 KV，复合主键 config_group 加 config_key）';

-- G2 activity_configs：活动/社区配置 KV
-- 源 API：activityDraw.json / invitationAssist.json / communityShare.json / lotteryRule.json
DROP TABLE IF EXISTS `activity_configs`;
CREATE TABLE `activity_configs` (
  `config_key` VARCHAR(128) NULL COMMENT '设计新增，非源站字段：取源站字段名作 key',
  `config_value` TEXT NULL COMMENT '源站各字段值：draw 组含 activity/draw_rule，assist 组含 hero_image/assist_tip，community_share 组含 share_images/audit_status/audit_text，lottery 组含 rule',
  `config_group` VARCHAR(32) NULL DEFAULT '' COMMENT '设计新增，非源站字段：draw / assist / community_share / lottery',
  `created_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：灌库审计用 unix 秒',
  `updated_at` BIGINT UNSIGNED NULL DEFAULT 0 COMMENT '设计新增，非源站字段：乐观更新用 unix 秒',
PRIMARY KEY (`config_key`),
KEY `idx_aac_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='G2 activity_configs（活动/社区配置 KV）';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 附录一：建表顺序清单（依赖顺序，共 48 张表）
-- =============================================================================
-- 原则：先建被引用方（users / series / products），再建引用方。本脚本已按此
--       顺序**物理排序输出**，直接顺序执行即可，无需分组。
--
-- 关键依赖链（自检已验证：所有 FK 目标表均在前方定义）：
--   users ──┬─→ user_addresses / user_invitations / user_invitation_assists
--           ├─→ user_collections ─→ market_listings ─→ (orders)
--           ├─→ orders ─→ order_cards / user_shop_exchanges
--           ├─→ chat_messages（chat_sessions 亦须先建）
--           ├─→ user_crystal_logs / user_sign_status / rank_snapshots
--           ├─→ rebate_profiles / rebate_invites / regift_records
--           └─→ compound_results（经 user_compound_records）
--   series ─→ products ─┬─→ product_pool_items / product_sale_rules / collection_price_ticks
--                       ├─→ kline_snapshots / product_market_stats / entrust_orders
--                       ├─→ orders / market_listings
--                       └─→ compound_scheme_items ─→ user_compound_records
--   community_posts ─→ community_comments（post_id + parent_id 自关联）
--   chat_sessions ─→ chat_messages
--
-- 【注意】E 域内 chat_sessions（E5）物理上先于 chat_messages（E4）输出——
--   因 chat_messages.session_id 有 FK 指向 chat_sessions.id，MySQL 要求
--   被引用表先建，否则属错误建表顺序（即便 FOREIGN_KEY_CHECKS=0 可绕过，
--   也会在开启校验后 ALTER 失败）。
--
-- 注：每张表均以 DROP TABLE IF EXISTS 开头，脚本可反复执行（幂等重建）。

-- =============================================================================
-- 附录二：ER 关系对应的外键约束说明
-- =============================================================================
-- 本脚本共落地 **17 个强 FOREIGN KEY 约束**（v1.0 为 45 个，v1.1 按外键强度分级
-- 降级 28 个为弱引用），覆盖 DATABASE.md §5 ER 图中「父记录必然在库」的关系。
-- 另有 **26 个弱引用列**只建索引不建 FK，**12 个 `_raw` 列**留痕源站原值。
--
-- 以下为**刻意不建 FK 的诚实说明**（遵循「不制造虚假关联」原则）：
--
-- 0. 【v1.1 新增】所有指向 `users.id` 的列（user_addresses / user_invitations /
--    user_invitation_assists / user_collections / market_listings.sale_user_id +
--    buy_user_id / orders / entrust_orders / user_compound_records /
--    user_lottery_records / draw_codes / user_draw_records / user_shop_exchanges /
--    user_crystal_logs / community_posts / chat_messages / rank_snapshots /
--    rebate_profiles / user_sign_status / rebate_invites.inviter_id + invitee_id /
--    regift_records.from_user_id）
--    —— 实测 users 仅2 条（4930 / 22291），而 market_listings 有 33 条挂单引用
--       20+ 个不同卖家，源站只暴露登录用户与 marketDetail 卖家。属**弱引用**，
--       建 FK 会导致 100% 灌库失败。仅建索引，COMMENT 已标注 0/NULL 语义。
-- 0-b. 【v1.1 新增】实测出现 0 哨兵或悬空值的 product_id / series_id 列
--    （rank_snapshots.product_id：榜单接口不返回商品 ID，实测约 18 条为 0；
--    product_market_stats.series_id：getMarketList 快照无 series 字段、且
--    series_id=14 在 series-10/series-15/categoryManager 三份mock 中均不存在，
--    实测 21 条；market_listings.series_id / entrust_orders.product_id /
--    kline_snapshots.product_id / collection_price_ticks.product_id）
--    —— 同样降级为弱引用 + 索引 + `_raw` 原值留痕。
--    注：market_listings.series_id=3 在 series 表实有（series 实有 id
--    1-7/10/11/15），但该列混有 0 与悬空值，整体按弱引用处理。
-- 1. user_collections.collection_code / collection_code_num **不与 id 建 FK**
--    —— marketDetail 的 387750 与 user_collections.id=77001 属不同自增序列
--       （裁决 A 已确认）。仅作属性列。
-- 2. collection_flow_records.collection_code **不建 FK**
--    —— 源站 flowDoc 只给 code（"QC-2024-0031"）不给 id，无法建立可靠关联。
-- 3. entrust_orders.collection_code **不建 FK** —— 同上，仅存编号属性列。
-- 4. affiches.type / affiche_type **不建 FK**（指向 affiche_types）
--    —— 实测 type 为字符串 "1"、affiche_type 为中文名，类型不稳定，
--       以「冗余列 + 应用层映射」处理，避免类型不匹配导致关联失败。
-- 5. entrust_orders → series **未建 FK**
--    —— ER 图标注该关系，但源站 entrustList 无 series_id 字段，
--       仅可经 product_id 间接推导，故不重复建冗余 FK。
-- 6. rebate_profiles / user_sign_status **以 user_id 作主键**
--    —— 一人一概况 / 一人一签到状态，无独立 id，PK 即索引；其 user_id 同样
--       属弱引用（见上文第 0 条），故 v1.1 起不再建 FK 到 users。
-- 7. JSON 列不拆表（product_sale_rules.rules、kline_snapshots.asks/bids/deals、
--    shop_goods.pool_items、user_compound_records.consume、lottery_rounds.prizes/consume、
--    user_collections 相关 images、community_posts.images、affiches.related_products）
--    —— 均为纯展示、无按档位查询需求（实测仅 5~6 档），故存 JSON 不建关联表。
-- 8. **全库零 ENUM 类型** —— 源站枚举会增删改值，MySQL ENUM 改值属 DDL 灾难
--    （锁表重建）。一律 TINYINT/VARCHAR + COMMENT 标注语义。
--
-- 【灌库注意】
-- 1. 匹配不到父记录时，**填 NULL，不再填 0**（v1.0 的「统一填 0」是 141 条外键
--    违规的直接原因）。同时把源站原值（含 0）写入对应 `_raw` 列。
-- 2. 灌库顺序仍按 §附录一依赖顺序；因 users 是弱引用目标，users 灌完后
--    **不再需要** `PRAGMA foreign_keys=OFF`，17 个强 FK 全程可开启校验。
-- 3. 强 FK 列若出现悬空 ID，灌库层必须先校验父表存在性，不存在则置 NULL
--    并在 `_raw` 留痕，**不得臆造 ID**。
