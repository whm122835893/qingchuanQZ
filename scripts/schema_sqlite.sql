-- 本文件由 scripts/convert_schema.py 从 docs/schema.sql 自动生成，请勿手工编辑。
-- 源：docs/schema.sql（MySQL 8.0 定稿）  生成器：convert_schema.py
-- 转换：类型映射 + 剥离 ENGINE/CHARSET/COMMENT + 行内索引转独立 CREATE INDEX

DROP TABLE IF EXISTS `users`;
-- 表 users（12 字段）
CREATE TABLE `users` (
  `id` INTEGER NULL,
  `username` TEXT NULL DEFAULT '',
  `nickname` TEXT NULL DEFAULT '',
  `mobile` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `score` INTEGER NOT NULL DEFAULT 0,
  `inviter_code` TEXT NULL DEFAULT '',
  `yao_count` INTEGER NOT NULL DEFAULT 0,
  `huifu_service_charge` NUMERIC NOT NULL DEFAULT 0.0000,
  `sandpay_service_charge` NUMERIC NOT NULL DEFAULT 0.0000,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_addresses`;
-- 表 user_addresses（11 字段）
CREATE TABLE `user_addresses` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `name` TEXT NULL DEFAULT '',
  `mobile` TEXT NULL DEFAULT '',
  `province` TEXT NULL DEFAULT '',
  `city` TEXT NULL DEFAULT '',
  `area` TEXT NULL DEFAULT '',
  `address` TEXT NULL DEFAULT '',
  `is_default` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_invitations`;
-- 表 user_invitations（8 字段）
CREATE TABLE `user_invitations` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `invitee_mobile` TEXT NULL DEFAULT '',
  `invite_time` INTEGER NULL DEFAULT 0,
  `status` INTEGER NOT NULL DEFAULT 0,
  `remark` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_invitation_assists`;
-- 表 user_invitation_assists（10 字段）
CREATE TABLE `user_invitation_assists` (
  `id` INTEGER NULL,
  `code` TEXT NULL DEFAULT '',
  `user_id` INTEGER NULL DEFAULT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `assist_time` TEXT NULL DEFAULT '',
  `is_new_user` INTEGER NOT NULL DEFAULT 0,
  `is_real` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `series`;
-- 表 series（12 字段）
CREATE TABLE `series` (
  `id` INTEGER NULL,
  `name` TEXT NULL DEFAULT '',
  `is_def` INTEGER NOT NULL DEFAULT 0,
  `flag` INTEGER NOT NULL DEFAULT 0,
  `pattern` INTEGER NOT NULL DEFAULT 0,
  `category_group` INTEGER NULL DEFAULT NULL,
  `resale_put_start_time` TEXT NULL DEFAULT '',
  `resale_put_end_time` TEXT NULL DEFAULT '',
  `resale_buy_start_time` TEXT NULL DEFAULT '',
  `resale_buy_end_time` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `products`;
-- 表 products（34 字段）
CREATE TABLE `products` (
  `id` INTEGER NULL,
  `series_id` INTEGER NULL DEFAULT NULL,
  `series_id_raw` TEXT NULL,
  `name` TEXT NULL DEFAULT '',
  `goods_type` INTEGER NULL DEFAULT NULL,
  `listimg` TEXT NULL DEFAULT '',
  `main_image` TEXT NULL DEFAULT '',
  `introduce_image` TEXT NULL DEFAULT '',
  `introduce` TEXT NULL,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `flux` INTEGER NOT NULL DEFAULT 0,
  `sale_total_num` INTEGER NOT NULL DEFAULT 0,
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `batch` TEXT NULL DEFAULT '',
  `collection_level` TEXT NULL DEFAULT '',
  `issuer_id` INTEGER NOT NULL DEFAULT 0,
  `creator_id` INTEGER NOT NULL DEFAULT 0,
  `publisher_name` TEXT NULL DEFAULT '',
  `publisher_logo` TEXT NULL DEFAULT '',
  `compound_num` INTEGER NOT NULL DEFAULT 0,
  `release_time` INTEGER NOT NULL DEFAULT 0,
  `types` INTEGER NOT NULL DEFAULT 0,
  `url_3d_type` TEXT NULL DEFAULT '',
  `url_3d` TEXT NULL DEFAULT '',
  `purchase_information` TEXT NULL,
  `is_img_diff` INTEGER NOT NULL DEFAULT 0,
  `is_lock` INTEGER NOT NULL DEFAULT 0,
  `weither_regift` INTEGER NOT NULL DEFAULT 0,
  `weither_resale` INTEGER NOT NULL DEFAULT 0,
  `can_compose` INTEGER NOT NULL DEFAULT 0,
  `is_like` INTEGER NOT NULL DEFAULT 0,
  `is_sub` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_products_series_id` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `product_pool_items`;
-- 表 product_pool_items（10 字段）
CREATE TABLE `product_pool_items` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `name` TEXT NULL DEFAULT '',
  `probability` NUMERIC NOT NULL DEFAULT 0.000,
  `show_total_num` INTEGER NOT NULL DEFAULT 0,
  `listimg` TEXT NULL DEFAULT '',
  `rarity_icon` TEXT NULL DEFAULT '',
  `is_out` INTEGER NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_product_pool_items_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `product_sale_rules`;
-- 表 product_sale_rules（10 字段）
CREATE TABLE `product_sale_rules` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `name` TEXT NULL DEFAULT '',
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `sale_num` INTEGER NOT NULL DEFAULT 0,
  `rule_updated` TEXT NULL DEFAULT '',
  `rules` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_product_sale_rules_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `user_collections`;
-- 表 user_collections（29 字段）
CREATE TABLE `user_collections` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `collection_code` TEXT NULL DEFAULT '',
  `collection_code_num` INTEGER NULL,
  `serial_num` INTEGER NOT NULL DEFAULT 0,
  `series_total` INTEGER NOT NULL DEFAULT 0,
  `user_hash` TEXT NULL DEFAULT '',
  `user_hash_text` TEXT NULL DEFAULT '',
  `rz_code` TEXT NULL DEFAULT '',
  `status` INTEGER NULL DEFAULT NULL,
  `is_lock` INTEGER NOT NULL DEFAULT 0,
  `weither_regift` INTEGER NOT NULL DEFAULT 0,
  `weither_resale` INTEGER NOT NULL DEFAULT 0,
  `can_compose` INTEGER NOT NULL DEFAULT 0,
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `min_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `today_volume` INTEGER NOT NULL DEFAULT 0,
  `has_sold` INTEGER NOT NULL DEFAULT 0,
  `count` INTEGER NOT NULL DEFAULT 0,
  `flux` INTEGER NOT NULL DEFAULT 0,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `zuzhao_info_id` INTEGER NULL,
  `task_id` TEXT NULL DEFAULT '',
  `blind_box_id` INTEGER NULL,
  `createtime` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_collections_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `collection_flow_records`;
-- 表 collection_flow_records（8 字段）
CREATE TABLE `collection_flow_records` (
  `id` INTEGER NULL,
  `collection_code` TEXT NULL DEFAULT '',
  `user_id` INTEGER NULL DEFAULT 0,
  `nickname` TEXT NULL DEFAULT '',
  `flow_time` INTEGER NULL DEFAULT 0,
  `source_type` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `collection_price_ticks`;
-- 表 collection_price_ticks（11 字段）
CREATE TABLE `collection_price_ticks` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `collection_code` TEXT NULL DEFAULT '',
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `num` INTEGER NOT NULL DEFAULT 0,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `tick_time` TEXT NULL DEFAULT '',
  `sale_type` INTEGER NULL DEFAULT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `market_listings`;
-- 表 market_listings（36 字段）
CREATE TABLE `market_listings` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `series_id` INTEGER NULL DEFAULT NULL,
  `series_id_raw` TEXT NULL,
  `collection_id` INTEGER NULL,
  `sale_user_id` INTEGER NULL DEFAULT NULL,
  `sale_user_nickname` TEXT NULL DEFAULT '',
  `buy_user_id` INTEGER NULL DEFAULT NULL,
  `buy_user_id_raw` TEXT NULL,
  `name` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `series_name` TEXT NULL DEFAULT '',
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `min_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `status` INTEGER NULL DEFAULT NULL,
  `goods_type` INTEGER NULL DEFAULT NULL,
  `income_type` TEXT NULL,
  `income_type_raw` TEXT NULL,
  `pay_way` TEXT NULL DEFAULT '',
  `order_sn` TEXT NULL DEFAULT '',
  `sale_time` INTEGER NULL,
  `listing_time` INTEGER NOT NULL DEFAULT 0,
  `update_time` INTEGER NOT NULL DEFAULT 0,
  `rush_status` INTEGER NOT NULL DEFAULT 0,
  `pay_platform_service_rate` NUMERIC NOT NULL DEFAULT 0.0000,
  `platform_service_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `creator_service_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `real_income` NUMERIC NOT NULL DEFAULT 0.0000,
  `buy_version` INTEGER NOT NULL DEFAULT 0,
  `is_deleted` INTEGER NOT NULL DEFAULT 0,
  `pay_text` INTEGER NOT NULL DEFAULT 0,
  `img` TEXT NULL DEFAULT '',
  `name_ext` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_market_listings_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_market_listings_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `user_collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `orders`;
-- 表 orders（31 字段）
CREATE TABLE `orders` (
  `id` INTEGER NULL,
  `order_sn` TEXT NULL DEFAULT '',
  `order_status` INTEGER NOT NULL DEFAULT 0,
  `order_type` INTEGER NOT NULL DEFAULT 1,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `product_name` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `collection_code` TEXT NULL DEFAULT '',
  `collection_code_raw` TEXT NULL,
  `user_hash_text` TEXT NULL DEFAULT '',
  `number` INTEGER NOT NULL DEFAULT 0,
  `num` INTEGER NOT NULL DEFAULT 0,
  `sale_number` INTEGER NOT NULL DEFAULT 0,
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `total_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `order_amount` NUMERIC NOT NULL DEFAULT 0.0000,
  `discount_amount` NUMERIC NOT NULL DEFAULT 0.0000,
  `pay_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `pay_way` TEXT NULL DEFAULT '',
  `pay_name` TEXT NULL DEFAULT '',
  `income_type` TEXT NULL,
  `income_type_raw` TEXT NULL,
  `goods_type` INTEGER NULL DEFAULT NULL,
  `remark` TEXT NULL DEFAULT '',
  `card` TEXT NULL,
  `order_time` INTEGER NOT NULL DEFAULT 0,
  `update_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  `user_id` INTEGER NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_orders_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `order_cards`;
-- 表 order_cards（7 字段）
CREATE TABLE `order_cards` (
  `id` INTEGER NULL,
  `order_id` INTEGER NULL DEFAULT NULL,
  `card_no` TEXT NULL,
  `bank` TEXT NULL,
  `amount` NUMERIC NOT NULL DEFAULT 0.0000,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_order_cards_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `entrust_orders`;
-- 表 entrust_orders（19 字段）
CREATE TABLE `entrust_orders` (
  `id` INTEGER NULL,
  `order_sn` TEXT NULL DEFAULT '',
  `order_status` INTEGER NULL DEFAULT NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `goods_name` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `collection_code` TEXT NULL DEFAULT '',
  `number` INTEGER NOT NULL DEFAULT 0,
  `num` INTEGER NOT NULL DEFAULT 0,
  `sale_number` INTEGER NOT NULL DEFAULT 0,
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `total_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `pay_way` TEXT NULL DEFAULT '',
  `beg_time` INTEGER NOT NULL DEFAULT 0,
  `update_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `trade_unions`;
-- 表 trade_unions（9 字段）
CREATE TABLE `trade_unions` (
  `id` INTEGER UNSIGNED NULL,
  `unlock` INTEGER NOT NULL DEFAULT 0,
  `member_count` INTEGER NOT NULL DEFAULT 0,
  `rebate_holder` NUMERIC NOT NULL DEFAULT 0.00,
  `rebate_invited` NUMERIC NOT NULL DEFAULT 0.00,
  `rebate_extra` NUMERIC NOT NULL DEFAULT 0.00,
  `max_bind` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `kline_snapshots`;
-- 表 kline_snapshots（20 字段）
CREATE TABLE `kline_snapshots` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `product_name` TEXT NULL DEFAULT '',
  `series_name` TEXT NULL DEFAULT '',
  `price` NUMERIC NOT NULL DEFAULT 0.0000,
  `change` TEXT NULL,
  `increase` INTEGER NOT NULL DEFAULT 0,
  `flux` INTEGER NOT NULL DEFAULT 0,
  `deal_5min` INTEGER NOT NULL DEFAULT 0,
  `deal_1h` INTEGER NOT NULL DEFAULT 0,
  `deal_today` INTEGER NOT NULL DEFAULT 0,
  `high_24h` NUMERIC NOT NULL DEFAULT 0.0000,
  `low_24h` NUMERIC NOT NULL DEFAULT 0.0000,
  `asks` TEXT NULL,
  `bids` TEXT NULL,
  `deals` TEXT NULL,
  `snapshot_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `activities`;
-- 表 activities（12 字段）
CREATE TABLE `activities` (
  `id` INTEGER NULL,
  `title` TEXT NULL DEFAULT '',
  `listimg` TEXT NULL DEFAULT '',
  `type` INTEGER NULL DEFAULT NULL,
  `start_time` TEXT NULL DEFAULT '',
  `end_time` TEXT NULL DEFAULT '',
  `join_num` INTEGER NOT NULL DEFAULT 0,
  `status` INTEGER NOT NULL DEFAULT 0,
  `qualify` TEXT NULL DEFAULT '',
  `route` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `compound_schemes`;
-- 表 compound_schemes（13 字段）
CREATE TABLE `compound_schemes` (
  `id` INTEGER NULL,
  `play_id` INTEGER NOT NULL DEFAULT 0,
  `title` TEXT NULL DEFAULT '',
  `listimg` TEXT NULL DEFAULT '',
  `target_img` TEXT NULL DEFAULT '',
  `start_time` INTEGER NOT NULL DEFAULT 0,
  `end_time` INTEGER NOT NULL DEFAULT 0,
  `join_num` INTEGER NOT NULL DEFAULT 0,
  `qualify` TEXT NULL DEFAULT '',
  `rule_url` TEXT NULL DEFAULT '',
  `rule_text` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `compound_scheme_items`;
-- 表 compound_scheme_items（10 字段）
CREATE TABLE `compound_scheme_items` (
  `id` INTEGER NULL,
  `scheme_id` INTEGER NULL DEFAULT NULL,
  `condition_name` TEXT NULL DEFAULT '',
  `need_num` INTEGER NOT NULL DEFAULT 0,
  `collection_code` TEXT NULL DEFAULT '',
  `collection_name` TEXT NULL DEFAULT '',
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `image` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_compound_scheme_items_scheme_id` FOREIGN KEY (`scheme_id`) REFERENCES `compound_schemes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `user_compound_records`;
-- 表 user_compound_records（11 字段）
CREATE TABLE `user_compound_records` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `scheme_id` INTEGER NULL DEFAULT NULL,
  `title` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `materials` TEXT NULL DEFAULT '',
  `method` INTEGER NOT NULL DEFAULT 0,
  `consume` TEXT NULL,
  `record_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_compound_records_scheme_id` FOREIGN KEY (`scheme_id`) REFERENCES `compound_schemes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `compound_results`;
-- 表 compound_results（11 字段）
CREATE TABLE `compound_results` (
  `id` INTEGER NULL,
  `record_id` INTEGER NULL DEFAULT NULL,
  `result_type` TEXT NOT NULL DEFAULT '',
  `name` TEXT NULL DEFAULT '',
  `user_collection_code` TEXT NULL,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `number` INTEGER NOT NULL DEFAULT 0,
  `crystal_type` INTEGER NOT NULL DEFAULT 0,
  `single_quantity` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_compound_results_record_id` FOREIGN KEY (`record_id`) REFERENCES `user_compound_records` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `lottery_rounds`;
-- 表 lottery_rounds（7 字段）
CREATE TABLE `lottery_rounds` (
  `id` INTEGER NULL,
  `end_time` INTEGER NOT NULL DEFAULT 0,
  `prizes` TEXT NULL,
  `consume` TEXT NULL,
  `rule` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_lottery_records`;
-- 表 user_lottery_records（8 字段）
CREATE TABLE `user_lottery_records` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `prize_name` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `prize_kind` INTEGER NULL DEFAULT NULL,
  `record_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `draw_codes`;
-- 表 draw_codes（7 字段）
CREATE TABLE `draw_codes` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `code` TEXT NULL DEFAULT '',
  `code_type` INTEGER NULL DEFAULT NULL,
  `create_time_str` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_draw_records`;
-- 表 user_draw_records（7 字段）
CREATE TABLE `user_draw_records` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `draw_sn` TEXT NULL DEFAULT '',
  `draw_time` TEXT NULL DEFAULT '',
  `status` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `sign_reward_rules`;
-- 表 sign_reward_rules（6 字段）
CREATE TABLE `sign_reward_rules` (
  `id` INTEGER NULL,
  `day` INTEGER NOT NULL DEFAULT 0,
  `crystal` INTEGER NOT NULL DEFAULT 0,
  `sign_rule` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_sign_status`;
-- 表 user_sign_status（7 字段）
CREATE TABLE `user_sign_status` (
  `user_id` INTEGER NULL,
  `continuous_days` INTEGER NOT NULL DEFAULT 0,
  `sign_days` TEXT NULL,
  `sign_status` INTEGER NOT NULL DEFAULT 0,
  `crystal_number` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`user_id`)
);

DROP TABLE IF EXISTS `shop_goods`;
-- 表 shop_goods（18 字段）
CREATE TABLE `shop_goods` (
  `id` INTEGER NULL,
  `name` TEXT NULL DEFAULT '',
  `list_image` TEXT NULL DEFAULT '',
  `crystal_price` INTEGER NOT NULL DEFAULT 0,
  `exchange_status` INTEGER NULL DEFAULT NULL,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `exchange_num` INTEGER NOT NULL DEFAULT 0,
  `goods_type` INTEGER NULL DEFAULT NULL,
  `end_time` INTEGER NOT NULL DEFAULT 0,
  `max_count` INTEGER NOT NULL DEFAULT 0,
  `is_sub` INTEGER NOT NULL DEFAULT 0,
  `count_down` INTEGER NOT NULL DEFAULT 0,
  `shop_type` INTEGER NOT NULL DEFAULT 0,
  `details` TEXT NULL,
  `crystal_type` INTEGER NOT NULL DEFAULT 0,
  `pool_items` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `user_shop_exchanges`;
-- 表 user_shop_exchanges（10 字段）
CREATE TABLE `user_shop_exchanges` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `order_id` INTEGER NULL DEFAULT NULL,
  `goods_name` TEXT NULL DEFAULT '',
  `list_image` TEXT NULL DEFAULT '',
  `crystal_number` INTEGER NOT NULL DEFAULT 0,
  `crystal_type` INTEGER NOT NULL DEFAULT 0,
  `create_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_shop_exchanges_order_id` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `user_crystal_logs`;
-- 表 user_crystal_logs（8 字段）
CREATE TABLE `user_crystal_logs` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `model` INTEGER NULL DEFAULT NULL,
  `memo` TEXT NULL DEFAULT '',
  `crystal` INTEGER NOT NULL DEFAULT 0,
  `log_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `community_posts`;
-- 表 community_posts（9 字段）
CREATE TABLE `community_posts` (
  `id` INTEGER NULL,
  `user_id` INTEGER NULL DEFAULT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `content` TEXT NULL,
  `create_time_str` TEXT NULL,
  `images` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `community_comments`;
-- 表 community_comments（12 字段）
CREATE TABLE `community_comments` (
  `id` INTEGER NULL,
  `post_id` INTEGER NULL DEFAULT NULL,
  `parent_id` INTEGER NULL,
  `content` TEXT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `reply_nickname` TEXT NULL DEFAULT '',
  `reply_avatar` TEXT NULL DEFAULT '',
  `has_more` INTEGER NOT NULL DEFAULT 0,
  `create_time_str` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_community_comments_post_id` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_community_comments_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `community_comments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `community_share_records`;
-- 表 community_share_records（5 字段）
CREATE TABLE `community_share_records` (
  `id` INTEGER NULL,
  `community` TEXT NULL DEFAULT '',
  `create_time` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `chat_sessions`;
-- 表 chat_sessions（4 字段）
CREATE TABLE `chat_sessions` (
  `id` INTEGER NULL,
  `name` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `chat_messages`;
-- 表 chat_messages（11 字段）
CREATE TABLE `chat_messages` (
  `id` INTEGER NULL,
  `session_id` INTEGER NULL DEFAULT 1,
  `is_self` INTEGER NOT NULL DEFAULT 0,
  `user_id` INTEGER NULL DEFAULT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `content` TEXT NULL,
  `date_text` TEXT NULL DEFAULT '',
  `show_date` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_chat_messages_session_id` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `news_articles`;
-- 表 news_articles（6 字段）
CREATE TABLE `news_articles` (
  `id` INTEGER NULL,
  `title` TEXT NULL DEFAULT '',
  `content` TEXT NULL,
  `publish_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `affiche_types`;
-- 表 affiche_types（4 字段）
CREATE TABLE `affiche_types` (
  `id` INTEGER NULL,
  `name` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `affiches`;
-- 表 affiches（13 字段）
CREATE TABLE `affiches` (
  `id` INTEGER NULL,
  `title` TEXT NULL DEFAULT '',
  `image` TEXT NULL DEFAULT '',
  `url` TEXT NULL DEFAULT '',
  `type` TEXT NULL DEFAULT '',
  `affiche_type` TEXT NULL DEFAULT '',
  `view_count` INTEGER NOT NULL DEFAULT 0,
  `publish_time` TEXT NULL DEFAULT '',
  `publish_time_ts` INTEGER NOT NULL DEFAULT 0,
  `content` TEXT NULL,
  `related_products` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `banners`;
-- 表 banners（7 字段）
CREATE TABLE `banners` (
  `id` INTEGER NULL,
  `image` TEXT NULL DEFAULT '',
  `url` TEXT NULL DEFAULT '',
  `url_type` INTEGER NOT NULL DEFAULT 0,
  `is_show` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `diypage_components`;
-- 表 diypage_components（8 字段）
CREATE TABLE `diypage_components` (
  `id` INTEGER NULL,
  `type` TEXT NULL DEFAULT '',
  `category` TEXT NULL DEFAULT '',
  `name` TEXT NULL DEFAULT '',
  `content` TEXT NULL,
  `decorate_id` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `product_market_stats`;
-- 表 product_market_stats（25 字段）
CREATE TABLE `product_market_stats` (
  `id` INTEGER NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `name` TEXT NULL DEFAULT '',
  `listimg` TEXT NULL DEFAULT '',
  `series_id` INTEGER NULL DEFAULT NULL,
  `series_id_raw` TEXT NULL,
  `goods_type` INTEGER NULL DEFAULT NULL,
  `total_num` INTEGER NOT NULL DEFAULT 0,
  `flux` INTEGER NOT NULL DEFAULT 0,
  `min_price` NUMERIC NOT NULL DEFAULT 0.0000,
  `deal_num` INTEGER NOT NULL DEFAULT 0,
  `market_value` INTEGER NOT NULL DEFAULT 0,
  `market_fluctuate` NUMERIC NOT NULL DEFAULT 0.00,
  `market_fluctuate_new` NUMERIC NOT NULL DEFAULT 0.00,
  `reprice_limit` NUMERIC NOT NULL DEFAULT 0.0000,
  `is_out` INTEGER NOT NULL DEFAULT 0,
  `flag` INTEGER NOT NULL DEFAULT 0,
  `select_status` INTEGER NOT NULL DEFAULT 0,
  `collection_level` TEXT NULL DEFAULT '',
  `openresale_time` INTEGER NOT NULL DEFAULT 0,
  `new_time` INTEGER NOT NULL DEFAULT 0,
  `stat_date` TEXT NULL,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_product_market_stats_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `rank_snapshots`;
-- 表 rank_snapshots（15 字段）
CREATE TABLE `rank_snapshots` (
  `id` INTEGER NULL,
  `rank_type` TEXT NOT NULL DEFAULT '',
  `user_id` INTEGER NULL DEFAULT NULL,
  `product_id` INTEGER NULL DEFAULT NULL,
  `product_id_raw` TEXT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `avatar` TEXT NULL DEFAULT '',
  `score` NUMERIC NOT NULL DEFAULT 0.0000,
  `secondary_score` NUMERIC NOT NULL DEFAULT 0.0000,
  `count` INTEGER NOT NULL DEFAULT 0,
  `event_time` TEXT NULL DEFAULT '',
  `payload` TEXT NULL,
  `snapshot_time` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `rebate_profiles`;
-- 表 rebate_profiles（9 字段）
CREATE TABLE `rebate_profiles` (
  `user_id` INTEGER NULL,
  `all_commision` NUMERIC NOT NULL DEFAULT 0.0000,
  `yesterday_commision` NUMERIC NOT NULL DEFAULT 0.0000,
  `user_transaction` NUMERIC NOT NULL DEFAULT 0.0000,
  `mingxia_commision` NUMERIC NOT NULL DEFAULT 0.0000,
  `yao_counts` INTEGER NOT NULL DEFAULT 0,
  `you_yao_counts` INTEGER NOT NULL DEFAULT 0,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`user_id`)
);

DROP TABLE IF EXISTS `rebate_invites`;
-- 表 rebate_invites（10 字段）
CREATE TABLE `rebate_invites` (
  `id` INTEGER NULL,
  `inviter_id` INTEGER NULL DEFAULT NULL,
  `invitee_id` INTEGER NULL DEFAULT NULL,
  `nickname` TEXT NULL DEFAULT '',
  `join_time` TEXT NULL DEFAULT '',
  `first_transaction_time` TEXT NULL DEFAULT '',
  `user_transaction` NUMERIC NOT NULL DEFAULT 0.0000,
  `month_transaction` NUMERIC NOT NULL DEFAULT 0.0000,
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);

DROP TABLE IF EXISTS `regift_records`;
-- 表 regift_records（14 字段）
CREATE TABLE `regift_records` (
  `id` INTEGER NULL,
  `collection_id` INTEGER NULL DEFAULT NULL,
  `collection_code` TEXT NULL DEFAULT '',
  `product_name` TEXT NULL DEFAULT '',
  `cover_image` TEXT NULL DEFAULT '',
  `from_user_id` INTEGER NULL DEFAULT NULL,
  `from_user_nickname` TEXT NULL DEFAULT '',
  `status` INTEGER NULL DEFAULT NULL,
  `status_text` TEXT NULL DEFAULT '',
  `order_no` TEXT NULL DEFAULT '',
  `create_time_str` TEXT NULL DEFAULT '',
  `back_time` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_regift_records_collection_id` FOREIGN KEY (`collection_id`) REFERENCES `user_collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `app_configs`;
-- 表 app_configs（6 字段）
CREATE TABLE `app_configs` (
  `config_group` TEXT NOT NULL DEFAULT 'basic',
  `config_key` TEXT NOT NULL,
  `config_value` TEXT NULL,
  `value_type` TEXT NULL DEFAULT 'string',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`config_group`, `config_key`)
);

DROP TABLE IF EXISTS `activity_configs`;
-- 表 activity_configs（5 字段）
CREATE TABLE `activity_configs` (
  `config_key` TEXT NULL,
  `config_value` TEXT NULL,
  `config_group` TEXT NULL DEFAULT '',
  `created_at` INTEGER NULL DEFAULT 0,
  `updated_at` INTEGER NULL DEFAULT 0,
  PRIMARY KEY (`config_key`)
);

-- ---- 索引（由 MySQL 行内 KEY/UNIQUE KEY 转换而来）----
CREATE UNIQUE INDEX IF NOT EXISTS `uk_users_inviter_code` ON `users` (`inviter_code`);
CREATE INDEX IF NOT EXISTS `idx_users_mobile` ON `users` (`mobile`);
CREATE INDEX IF NOT EXISTS `idx_users_yao_count` ON `users` (`yao_count` DESC);
CREATE INDEX IF NOT EXISTS `idx_addr_user` ON `user_addresses` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_inv_user` ON `user_invitations` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_uia_user` ON `user_invitation_assists` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_uia_code` ON `user_invitation_assists` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_products_series_name` ON `products` (`series_id`, `name`);
CREATE INDEX IF NOT EXISTS `idx_products_series` ON `products` (`series_id`);
CREATE INDEX IF NOT EXISTS `idx_products_flux` ON `products` (`flux` DESC);
CREATE INDEX IF NOT EXISTS `idx_products_type` ON `products` (`goods_type`);
CREATE INDEX IF NOT EXISTS `idx_products_series_type` ON `products` (`series_id`, `goods_type`);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_pool_product_name` ON `product_pool_items` (`product_id`, `name`);
CREATE INDEX IF NOT EXISTS `idx_pool_product` ON `product_pool_items` (`product_id`);
CREATE INDEX IF NOT EXISTS `idx_psr_product` ON `product_sale_rules` (`product_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_uc_code` ON `user_collections` (`collection_code`, `collection_code_num`);
CREATE INDEX IF NOT EXISTS `idx_uc_user_product` ON `user_collections` (`user_id`, `product_id`);
CREATE INDEX IF NOT EXISTS `idx_uc_status` ON `user_collections` (`status`);
CREATE INDEX IF NOT EXISTS `idx_uc_product` ON `user_collections` (`product_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_uc_user_createtime` ON `user_collections` (`user_id`, `createtime` DESC);
CREATE INDEX IF NOT EXISTS `idx_cfr_code` ON `collection_flow_records` (`collection_code`);
CREATE INDEX IF NOT EXISTS `idx_cpt_product` ON `collection_price_ticks` (`product_id`);
CREATE INDEX IF NOT EXISTS `idx_cpt_product_time` ON `collection_price_ticks` (`product_id`, `tick_time` DESC);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_ml_order_sn` ON `market_listings` (`order_sn`);
CREATE INDEX IF NOT EXISTS `idx_ml_product_status` ON `market_listings` (`product_id`, `status`, `price`);
CREATE INDEX IF NOT EXISTS `idx_ml_series` ON `market_listings` (`series_id`);
CREATE INDEX IF NOT EXISTS `idx_ml_sale_user` ON `market_listings` (`sale_user_id`, `status`);
CREATE INDEX IF NOT EXISTS `idx_ml_buy_user` ON `market_listings` (`buy_user_id`);
CREATE INDEX IF NOT EXISTS `idx_ml_listing_time` ON `market_listings` (`listing_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_ml_buy_version` ON `market_listings` (`buy_version`);
CREATE INDEX IF NOT EXISTS `idx_ml_sale_user_time` ON `market_listings` (`sale_user_id`, `listing_time` DESC);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_orders_sn` ON `orders` (`order_sn`);
CREATE INDEX IF NOT EXISTS `idx_order_user_status` ON `orders` (`order_type`, `order_status`, `order_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_order_product` ON `orders` (`product_id`);
CREATE INDEX IF NOT EXISTS `idx_order_user_time` ON `orders` (`user_id`, `order_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_oc_order` ON `order_cards` (`order_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_entrust_sn` ON `entrust_orders` (`order_sn`);
CREATE INDEX IF NOT EXISTS `idx_entrust_status` ON `entrust_orders` (`order_status`, `beg_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_entrust_product` ON `entrust_orders` (`product_id`);
CREATE INDEX IF NOT EXISTS `idx_entrust_user` ON `entrust_orders` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_kline_product_time` ON `kline_snapshots` (`product_id`, `snapshot_time` DESC);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_csi` ON `compound_scheme_items` (`scheme_id`, `collection_code`);
CREATE INDEX IF NOT EXISTS `idx_csi_scheme` ON `compound_scheme_items` (`scheme_id`);
CREATE INDEX IF NOT EXISTS `idx_ucr_user` ON `user_compound_records` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_ucr_scheme` ON `user_compound_records` (`scheme_id`);
CREATE INDEX IF NOT EXISTS `idx_cr_record` ON `compound_results` (`record_id`);
CREATE INDEX IF NOT EXISTS `idx_ulr_user` ON `user_lottery_records` (`user_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `uk_draw_code` ON `draw_codes` (`code`);
CREATE INDEX IF NOT EXISTS `idx_dc_user` ON `draw_codes` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_udr_user` ON `user_draw_records` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_srr_day` ON `sign_reward_rules` (`day`);
CREATE INDEX IF NOT EXISTS `idx_sg_type` ON `shop_goods` (`goods_type`);
CREATE INDEX IF NOT EXISTS `idx_use_user` ON `user_shop_exchanges` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_use_user_time` ON `user_shop_exchanges` (`user_id`, `create_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_use_order` ON `user_shop_exchanges` (`order_id`);
CREATE INDEX IF NOT EXISTS `idx_crystal_user` ON `user_crystal_logs` (`user_id`, `log_time` DESC);
CREATE INDEX IF NOT EXISTS `idx_cp_user` ON `community_posts` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_cc_post` ON `community_comments` (`post_id`, `parent_id`, `id`);
CREATE INDEX IF NOT EXISTS `idx_cc_parent` ON `community_comments` (`parent_id`);
CREATE INDEX IF NOT EXISTS `idx_cm_session` ON `chat_messages` (`session_id`, `id`);
CREATE INDEX IF NOT EXISTS `idx_cm_user` ON `chat_messages` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_affiches` ON `affiches` (`type`, `publish_time_ts` DESC);
CREATE INDEX IF NOT EXISTS `idx_affiches_time` ON `affiches` (`publish_time_ts` DESC);
CREATE INDEX IF NOT EXISTS `idx_bn_show` ON `banners` (`is_show`);
CREATE INDEX IF NOT EXISTS `idx_dp_decorate` ON `diypage_components` (`decorate_id`);
CREATE INDEX IF NOT EXISTS `idx_pms_product` ON `product_market_stats` (`product_id`, `stat_date` DESC);
CREATE INDEX IF NOT EXISTS `idx_pms_series` ON `product_market_stats` (`series_id`, `flux` DESC);
CREATE INDEX IF NOT EXISTS `idx_pms_mv` ON `product_market_stats` (`market_value` DESC);
CREATE INDEX IF NOT EXISTS `idx_pms_flux` ON `product_market_stats` (`flux` DESC);
CREATE INDEX IF NOT EXISTS `idx_rank` ON `rank_snapshots` (`rank_type`, `score` DESC);
CREATE INDEX IF NOT EXISTS `idx_rank_user` ON `rank_snapshots` (`user_id`);
CREATE INDEX IF NOT EXISTS `idx_rank_product` ON `rank_snapshots` (`product_id`);
CREATE INDEX IF NOT EXISTS `idx_ri_inviter` ON `rebate_invites` (`inviter_id`, `month_transaction` DESC);
CREATE INDEX IF NOT EXISTS `idx_ri_invitee` ON `rebate_invites` (`invitee_id`);
CREATE INDEX IF NOT EXISTS `idx_rr_collection` ON `regift_records` (`collection_id`);
CREATE INDEX IF NOT EXISTS `idx_rr_from_user` ON `regift_records` (`from_user_id`);
CREATE INDEX IF NOT EXISTS `idx_rr_status` ON `regift_records` (`status`);
CREATE INDEX IF NOT EXISTS `idx_ac_group` ON `app_configs` (`config_group`);
CREATE INDEX IF NOT EXISTS `idx_aac_group` ON `activity_configs` (`config_group`);
