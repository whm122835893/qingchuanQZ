'use strict'

/**
 * 我的藏品 controller：我的盲盒 / 开盒记录 / 开盒（写，已实现）/
 * 我的页藏品聚合（antMycollection）/ 持有详情弹窗（getDetail）。
 */
const service = require('../services/collection.service')
const writeService = require('../services/blindbox-write.service')
const responder = require('../middleware/respond')
const { currentUid } = require('../middleware/auth')
const { NotFoundError } = require('../errors')

async function myBox(req, res) {
  const data = await service.myBox(currentUid(req))
  if (!data) throw new NotFoundError('暂无盲盒')
  responder.single(res, data)
}

async function openlog(req, res) {
  responder.bareList(res, await service.openlog(currentUid(req), req.input))
}

/** 我的页藏品聚合列表（antMycollection）。types 见 service 注释 */
async function myCollections(req, res) {
  responder.nested(res, await service.myCollections(currentUid(req), req.input), '获取成功')
}

/** 持有详情弹窗（getDetail）。collection_id 命中不到时返回空壳而非 500 */
async function collectionDetail(req, res) {
  const data = await service.collectionDetail(currentUid(req), req.input)
  if (!data) throw new NotFoundError('藏品不存在')
  responder.nested(res, data, '获取成功')
}

/**
 * 逐个拆开（openbox，popDetails 弹窗「逐个拆开」+ blindBox result2 页）。
 *
 * 源站契约（pages-blindBox-index.0553f508.js / pages-my-my.0e9b7c94.js 实证）：
 *   入参 {openid}（源站 api 模块 9bd5：openBox=a=>post('/user_collection/user_collection/openbox',{openid:a})）；
 *   响应 data 为**单个对象**——result2 页 uni.getStorageSync("blindBoxResult") 后直接读
 *   info.rarity_icon / info.main_image / info.name / info.collection_code；
 *   popDetails.takeApart 同样消费 a.data||{} 作 resultSingle。
 *   数组形状由 openBoxs 提供（result 页 / openAll 消费 a.data||[]），二者不可互换。
 * blind_box_id 为兼容保留（旧调用方与 write_checks 走 openboxone，不受影响）。
 */
async function openbox(req, res) {
  const data = await writeService.openboxone(
    currentUid(req),
    req.input.openid ?? req.input.blind_box_id
  )
  if (!data) throw new NotFoundError('开盒未产出藏品')
  responder.single(res, data)
}

async function openboxone(req, res) {
  const data = await writeService.openboxone(currentUid(req), req.input.blind_box_id)
  if (!data) throw new NotFoundError('开盒未产出藏品')
  responder.single(res, data)
}

/**
 * 一键开启（openBoxs，popDetails 弹窗「一键开启」）。
 * 源站消费 t.data 为数组（openBoxs(openid).then(t => t.data || [])），故走 bareList。
 */
async function openBoxs(req, res) {
  responder.bareList(res, await writeService.openBoxs(currentUid(req), req.input.openid))
}

module.exports = { myBox, openlog, myCollections, collectionDetail, openbox, openboxone, openBoxs }