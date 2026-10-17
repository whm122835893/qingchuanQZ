'use strict'

/**
 * 写接口的 TODO 响应形状。
 *
 * 7 个写接口本轮不实现，但必须返回「结构与源站一致」的空壳，
 * 否则前端 utils/api.js 解析 data 时会因结构不符而崩页。
 * 这里声明各接口的空结构，值一律为 null / []，绝不编造业务数据。
 */
const TODO_MSG = 'TODO: 未实现'

/** 各写接口的源站空结构（字段名逐字对齐 public/mock/*.json） */
const SHAPES = {
  login: { userinfo: userInfoShape() },
  register: { userinfo: userInfoShape() },
  createBegBuyOrder: orderShape(),
  sell: orderShape(),
  openbox: [],
  openboxone: {
    id: null,
    name: null,
    collection_code: null,
    listimg: null,
    main_image: null,
    rarity_icon: null,
  },
  compoundResult: { result: [] },
}

function userInfoShape() {
  return {
    id: null,
    username: null,
    nickname: null,
    mobile: null,
    avatar: null,
    score: 0,
    inviter_code: null,
    yao_count: 0,
    huifu_service_charge: 0,
    sandpay_service_charge: 0,
    token: '',
  }
}

function orderShape() {
  return {
    id: null,
    order_sn: null,
    order_status: null,
    goods_id: null,
    goods_name: null,
    listimg: null,
    collection_code: null,
    user_hash_text: null,
    pay_way: null,
    pay_name: null,
    number: 0,
    num: 0,
    sale_number: 0,
    price: null,
    total_price: null,
    order_amount: null,
    discount_amount: null,
    pay_price: null,
    remark: '',
    createtime: 0,
    updatetime: 0,
    card: [],
    goods_type: null,
  }
}

function todoShape(name) {
  const shape = SHAPES[name]
  return shape === undefined ? null : JSON.parse(JSON.stringify(shape))
}

module.exports = { TODO_MSG, todoShape }