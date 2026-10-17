'use strict'

/**
 * 市场与行情域 service：市场列表 / 挂单详情 / 系列挂单列表 / 成交行情 / K线。
 */
const env = require('../config/env')
const marketRepo = require('../repositories/market.repository')
const productRepo = require('../repositories/product.repository')
const collectionRepo = require('../repositories/collection.repository')
const userRepo = require('../repositories/user.repository')
const { pagination, pageMeta } = require('../utils/validate')
const { money, money2, bool, jsonArray } = require('../utils/pick')
const { productBrief } = require('./product-shape')

/** 市场列表（getMarketList，style A 裸数组） */
async function marketList(params) {
  const page = pagination(params, env)
  const { items } = await marketRepo.listMarketItems({
    seriesId: params.series_id || null,
    goodsType: params.goods_type || null,
    page,
  })
  return items.map(marketListItem)
}

function marketListItem(r) {
  return {
    name: r.name,
    series_id: r.series_id,
    id: r.product_id,
    listimg: r.listimg,
    total_num: r.total_num,
    reprice_limit: money(r.reprice_limit),
    collection_level: blank(r.collection_level),
    openresale_time: r.openresale_time,
    flag: r.flag,
    select_status: r.select_status,
    deal_num: r.deal_num === null ? 0 : r.deal_num,
    flux: str(r.flux),
    is_like: r.p_is_like === null || r.p_is_like === undefined ? 0 : r.p_is_like,
    market_fluctuate_new: r.market_fluctuate_new,
    market_value: r.market_value,
    market_fluctuate: r.market_fluctuate,
    // 源站此字段时而是数字时而是字符串（is_out=1 的行为 "1234.00"），按原值返回
    min_price: r.min_price,
    is_out: r.is_out === null ? 0 : r.is_out,
    new_time: r.new_time,
    goods_type: r.goods_type === null ? '' : String(r.goods_type),
    product: {
      id: r.p_id === null || r.p_id === undefined ? r.product_id : r.p_id,
      name: r.p_name,
      listimg: r.p_listimg,
      total_num: r.p_total_num === null || r.p_total_num === undefined ? r.total_num : r.p_total_num,
    },
  }
}

function blank(v) {
  return v === undefined || v === null ? '' : v
}

function str(v) {
  return v === null || v === undefined ? '' : String(v)
}

/** 挂单详情（MarketDetail，style D）。悬空引用返回能返回的部分，缺失字段为 null */
async function marketDetail(id) {
  const listing = await marketRepo.findListing(id)
  if (!listing) return null
  const product = listing.product_id ? await productRepo.findProduct(listing.product_id) : null
  const saleUser = listing.sale_user_id ? await userRepo.findUser(listing.sale_user_id) : null
  const userCollection = listing.collection_id
    ? await collectionRepo.findUserCollection(listing.collection_id)
    : null

  return {
    id: listing.id,
    sale_user_id: listing.sale_user_id,
    sale_user_nickname: listing.sale_user_nickname || '',
    sale_user_collection_id: listing.collection_id,
    series_id: listing.series_id,
    goods_type: listing.goods_type,
    goods_id: listing.product_id,
    price: listing.price,
    status: listing.status,
    sale_time: listing.sale_time,
    buy_user_id: listing.buy_user_id,
    pay_platform_service_rate: money(listing.pay_platform_service_rate),
    platform_service_price: money(listing.platform_service_price),
    creator_service_price: money(listing.creator_service_price),
    real_income: money(listing.real_income),
    createtime: listing.listing_time,
    updatetime: listing.update_time,
    deleted: listing.is_deleted === null ? 0 : listing.is_deleted,
    buy_version: listing.buy_version === null ? 0 : listing.buy_version,
    order_sn: listing.order_sn || '',
    goods_name: listing.name,
    goods_cover_image: listing.cover_image,
    series_name: listing.series_name || '',
    // income_type 的 NULL 是合法状态（源站数字 1 未映射），不编造
    income_type: listing.income_type,
    product: product ? productBrief(product, 'company') : null,
    user: saleUser
      ? {
          id: saleUser.id,
          nickname: saleUser.nickname,
          avatar: saleUser.avatar,
          mobile: saleUser.mobile,
          url: '',
        }
      : null,
    img: listing.img || listing.cover_image,
    name: listing.name,
    rush_status: listing.rush_status === null ? 0 : listing.rush_status,
    user_collection: userCollection
      ? {
          id: userCollection.id,
          collection_code: userCollection.collection_code_num,
          user_hash_text: userCollection.user_hash_text,
          user_hash: userCollection.user_hash,
          zuzhao_info_id: userCollection.zuzhao_info_id,
          task_id: userCollection.task_id === null ? '' : userCollection.task_id,
          // 源站此处是 number（collectionInfo 的 rz_code 则是 string，两处不一致，不静默统一）
          rz_code:
            userCollection.rz_code === null || userCollection.rz_code === ''
              ? null
              : Number(userCollection.rz_code),
          task: null,
        }
      : null,
    pay_text: listing.pay_text === null ? 0 : listing.pay_text,
  }
}

async function seriesGoodsList(params) {
  const page = pagination(params, env)
  // endpoint_meta 明确：参数名 id 指「系列 id」而非商品 id（易误读，已在 note 标注）
  const seriesId = params.id || params.series_id
  // type：1=盲盒 2=单品，默认 2（源站页面实参）
  const goodsType = params.type === undefined || params.type === '' ? 2 : Number(params.type)
  const { items, total } = await marketRepo.listListingsBySeries(seriesId, goodsType, page)
  // product 段是「该系列下的商品」：优先按挂单的 product_id 反查，无挂单时按 series_id 取首个产品
  const product = await seriesProduct(seriesId, items)
  return {
    product: product
      ? {
          id: product.id,
          name: product.name,
          total_num: product.total_num,
          flux: product.flux === null ? 0 : product.flux,
          is_like: product.is_like === null ? 0 : product.is_like,
          batch_pay: 0,
          collection_level: blank(product.collection_level),
          listimg: product.listimg,
          issuer: product.publisher_name || '',
          introduce_image: product.introduce_image || '',
        }
      : null,
    total,
    current_page: page.page,
    last_page: pageMeta(total, page.page, page.pageSize).lastPage,
    data: items.map(listingRow),
  }
}

/** 该系列下的商品（product 段）：按挂单 product_id 反查，无挂单时回落到系列首个产品 */
async function seriesProduct(seriesId, listings) {
  const withProduct = listings.find((l) => l.product_id !== null && l.product_id !== undefined)
  if (withProduct) return productRepo.findProduct(withProduct.product_id)
  if (!seriesId) return null
  return productRepo.findProductBySeriesId(seriesId)
}

/** market_listings 行 → 源站挂单条目。income_type 源站为数组，取 raw 留痕列 */
function listingRow(r) {
  return {
    id: r.id,
    name: r.name,
    collection_code: r.collection_code_num,
    min_price: money2(r.min_price),
    status: r.status,
    income_type: r.income_type_raw ? jsonArray(r.income_type_raw) : incomeFallback(r.income_type),
    createtime: r.listing_time,
    listimg: r.cover_image,
  }
}

/** income_type 为 NULL 时返回空数组，不编造映射（DATABASE.md §4） */
function incomeFallback(v) {
  return v === null || v === undefined || v === '' ? [] : [v]
}

/** sellInfo.product.collection_code：优先藏品编号（字符串），无则回落挂单 id 字符串 */
function collectionCodeText(listing) {
  if (!listing) return null
  if (listing.collection_code) return String(listing.collection_code)
  return listing.id === null || listing.id === undefined ? null : String(listing.id)
}

/** 成交行情（collectionDetail / sellInfo，style D） */
async function collectionDetail(params) {
  const productId = params.id || params.product_id
  const product = await productRepo.findProduct(productId)
  const listing = await marketRepo.latestListingPrice(productId)
  const floor = await marketRepo.floorPrice(productId)
  const quote = await collectionRepo.todayQuote(productId)
  const ticks = await collectionRepo.listPriceTicks(productId)
  if (!product && !listing) return null
  return {
    id: product ? product.id : productId,
    goods_type: product ? product.goods_type : null,
    price: listing ? listing.price : null,
    name: product ? product.name : listing.name,
    series_name: listing ? listing.series_name || '' : '',
    status: listing ? listing.status : null,
    today_highest_price: money2(quote ? quote.highest : null),
    today_volume: quote && quote.volume !== null ? String(quote.volume) : '0',
    today_lowest_price: money2(quote ? quote.lowest : null),
    floor_price: money2(floor),
    product: product
      ? {
          id: product.id,
          name: product.name,
          main_image: product.main_image,
          listimg: product.listimg,
          // 源站此处是藏品编号字符串；market_listings 无该列，
          // 用藏品记录（collection_code_num）的字符串形态优先，否则取挂单 id 的字符串
          collection_code: collectionCodeText(listing),
          batch: product.batch === null ? '' : String(product.batch),
          publisher: product.publisher_name || '',
        }
      : null,
    list: ticks.map((t) => ({
      collection_code: t.collection_code,
      total_num: t.total_num,
      price: money2(t.price),
      num: t.num,
      time: t.tick_time,
    })),
  }
}

/** K线（klineInfo，style D） */
async function klineInfo(productId) {
  const row = await collectionRepo.findKline(productId)
  if (!row) return null
  return {
    name: row.product_name,
    series_name: row.series_name,
    price: money(row.price),
    change: row.change === null ? null : String(row.change),
    increase: bool(row.increase),
    num: {
      flux: str(row.flux),
      deal_5min: str(row.deal_5min),
      high_24h: str(row.high_24h),
      deal_1h: str(row.deal_1h),
      low_24h: str(row.low_24h),
      deal_today: str(row.deal_today),
    },
    asks: jsonArray(row.asks),
    bids: jsonArray(row.bids),
    deals: jsonArray(row.deals),
  }
}

module.exports = { marketList, marketDetail, seriesGoodsList, collectionDetail, klineInfo }