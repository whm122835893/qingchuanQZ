'use strict'

/**
 * 我的藏品域 service：我的盲盒 / 开盒记录。
 * 开盒写接口（openbox / openboxone）已实现，见 blindbox-write.service.js。
 */
const env = require('../config/env')
const collectionRepo = require('../repositories/collection.repository')
const productRepo = require('../repositories/product.repository')
const { pagination, pageMeta } = require('../utils/validate')

/**
 * 我的盲盒（myBox，style D）。
 *
 * user_collections 中 blind_box_id 非空的那条不挂 product_id，
 * 故名称/图片借 product_pool_items 所属产品补齐；取不到则为 null，不编造。
 */
async function myBox(userId) {
  const row = await collectionRepo.findMyBlindBox(userId)
  if (!row) return null
  const pool = row.product_id ? await productRepo.listPoolItems(row.product_id) : []
  return {
    id: row.blind_box_id,
    // name/listimg 已在 SQL 层 COALESCE：优先源站直取列，products 值兜底
    name: row.name,
    num: row.count,
    listimg: row.listimg,
    main_image: row.main_image,
    rarity_icon: pool.length ? pool[0].rarity_icon : null,
    product_id: row.product_id,
    user_collection_id: row.id,
  }
}

/** 开盒记录（openlog，style A） */
async function openlog(userId, params) {
  const page = pagination(params, env)
  const { items } = await collectionRepo.listBlindBoxRecords(userId, page)
  const out = []
  for (const r of items) {
    out.push({
      id: r.id,
      listimg: r.listimg,
      // 新表直接存源站的藏品名；products 关联命中时以关联名为准（同源，仅作保险）
      name: r.name || r.p_name || '',
      collection_code: r.collection_code,
      // 源站本快照中 rarity_icon 与 listimg 同值，原样返回不臆造
      rarity_icon: r.rarity_icon || null,
      createtime: r.createtime,
      // 新表已承载 box_name（源站直取），不再返回 null
      box_name: r.box_name || null,
    })
  }
  return out
}

/**
 * 我的页藏品聚合列表（antMycollection，style B + 两个附加计数字段）。
 *
 * types 语义与过滤条件见 repository.listMyCollectionGroups 注释（含 has_sold 裁决）。
 * 5 个 types=null 的 tab（绘画/卡牌/建模/卡券/元素）源站永不发请求，
 * 前端直接走空态；此处对未识别 types 返回空列表而非全量，双保险。
 */
async function myCollections(userId, params) {
  const types = params.types === undefined || params.types === null || params.types === ''
    ? null
    : Number(params.types)
  const page = pagination(params, env)
  const keyword = params.keywords ? String(params.keywords).trim() : null
  const { items, total } = await collectionRepo.listMyCollectionGroups(userId, {
    types,
    keyword,
    page,
  })
  const data = items.map((r) => ({
    collection: {
      id: r.collection_id,
      name: r.name || '',
      listimg: r.listimg || '',
      main_image: r.main_image || '',
    },
    num: Number(r.num) || 0,
    // min_price 为 0 视为「未提供」（0 是源站哨兵值），回落 floor_price → price
    min_price: r.min_price === null ? null : Number(r.min_price),
    floor_price: r.floor_price === null ? null : Number(r.floor_price),
    price: r.price === null ? null : Number(r.price),
    // 涨跌双字段（源站 item 契约）：change_rate ← pms.market_fluctuate（百分比），
    // market_fluctuate_new ← pms.market_fluctuate_new。前端 changeNum 优先取
    // market_fluctuate_new（源站逻辑 1:1 移植）；无 pms 快照的藏品（如青川山水，
    // products 缺 210）两者为 null，前端按 0 处理。
    change_rate: r.change_rate === null ? null : Number(r.change_rate),
    market_fluctuate_new: r.market_fluctuate_new === null ? null : Number(r.market_fluctuate_new),
  }))
  const meta = pageMeta(total, page.page, page.pageSize)
  const out = {
    total: meta.total,
    per_page: meta.pageSize,
    current_page: meta.page,
    last_page: meta.lastPage,
    data,
  }
  // types=1/2 才带这两个计数字段（源站实测 types=3 响应无此二键）
  if (types === 1 || types === 2) {
    const holdings = await collectionRepo.countHoldings(userId)
    out.current_count = holdings.current_count
    out.current_consignment = holdings.current_consignment
  }
  return out
}

/**
 * 持有天数（popDetails metaLine 的 day）。
 * createtime 为秒级时间戳；缺失返回 null（前端显示 --）。
 */
function holdDays(createtime) {
  const ts = Number(createtime)
  if (!ts) return null
  const days = Math.floor((Date.now() / 1000 - ts) / 86400)
  return days > 0 ? days : 0
}

/**
 * 持有详情弹窗（getDetail，style E 嵌套：{list:{分页}, collection:{...}}）。
 *
 * 源站实测响应：list.per_page 固定 1000；collection 形如
 * {id,name,main_image,listimg,total_num,total_num_show,is_img_diff,
 *  unfreeze_collection_id,freeze_time,avg_price,num,batch_up}。
 * 本地无对应来源的字段（is_img_diff / unfreeze 系列 / freeze_time）按 0/"" 兜底；
 * batch_up 按「存在可寄售实例」派生（见下方注释）。
 */
async function collectionDetail(userId, params) {
  const anchor = await collectionRepo.findCollectionAnchor(userId, params.collection_id)
  if (!anchor) return null
  const types = params.types === undefined || params.types === null || params.types === ''
    ? null
    : Number(params.types)
  // 源站 per_page 固定 1000（一次拉全量实例）
  const page = { page: 1, pageSize: 1000, offset: 0 }
  const { items, total } = await collectionRepo.listCollectionInstances(userId, anchor, {
    types,
    page,
  })
  const list = items.map((r) => ({
    id: r.id,
    collection_code: r.collection_code || '',
    status: r.status === null ? null : Number(r.status),
    is_lock: Number(r.is_lock) || 0,
    can_compose: Number(r.can_compose) || 0,
    price: r.price === null ? null : Number(r.price),
    blind_box_id: r.blind_box_id === null ? null : Number(r.blind_box_id),
    createtime: r.createtime,
    // popDetails.metaLine 契约字段（源站 pages-myCollection-myCollection.e92f03e5.js 26f1）：
    //   来源：sourceText(source_type ?? source_name) | 持有天数：day 天 |
    //   购入价：buy_price ?? price | 寄售价：from_price
    // 本地 schema 无来源列的如实给 null（前端渲染 "--"，不编造）；
    // day 由 createtime 诚实派生（源站语义即持有天数）。
    day: holdDays(r.createtime),
    source_type: null,
    source_name: null,
    buy_price: null,
    from_price: null,
    // 源站 statusText 判 0==is_link 才显示「上链中」；无此列 → null（==0 为 false，不显示）
    is_link: null,
  }))
  const prices = items.map((r) => Number(r.price) || 0).filter((n) => n > 0)
  // current_count / current_consignment 按实例实算（源站空账号快照二值均为 0，
  // 无口径可抄；与 antMycollection 同枚举：status=2 即寄售中）
  // batch_up：源站为商品维度开关（本地 schema 无此列）。弹窗头部「批量寄售」
  // 入口依赖它（2==types && collection.batch_up 才渲染）。按「是否存在可寄售实例
  // （status=1 未寄售且未锁定）」派生——与源站空账号快照（0 持有 → batch_up=0）
  // 一致，且不拿无来源的业务值冒充。
  const batchUp = items.some((r) => Number(r.status) === 1 && !Number(r.is_lock)) ? 1 : 0
  return {
    list: {
      total,
      per_page: 1000,
      current_page: 1,
      last_page: total > 0 ? 1 : 0,
      data: list,
      current_count: total,
      current_consignment: items.filter((r) => Number(r.status) === 2).length,
    },
    collection: {
      id: anchor.product_id === null ? anchor.id : anchor.product_id,
      name: anchor.name || anchor.p_name || '',
      main_image: anchor.main_image || anchor.p_main_image || '',
      listimg: anchor.listimg || anchor.p_listimg || '',
      total_num: Number(anchor.p_total_num) || Number(anchor.total_num) || 0,
      // 源站字段：用户视角的持有展示数（无对应来源，按 0 兜底）
      total_num_show: total,
      // 本地无对应来源的开关/时间字段，按源站默认值兜底
      is_img_diff: 0,
      unfreeze_collection_id: 0,
      freeze_time: 0,
      avg_price: prices.length
        ? Number((prices.reduce((s, n) => s + n, 0) / prices.length).toFixed(2))
        : 0,
      num: '',
      batch_up: batchUp,
    },
  }
}

module.exports = { myBox, openlog, myCollections, collectionDetail }