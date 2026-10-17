'use strict'

/**
 * 用户与账户域 service：用户信息、收货地址、邀请信息与记录。
 * 写接口（login / register）本轮不实现，仅在 controller 返回 TODO 响应。
 */
const env = require('../config/env')
const userRepo = require('../repositories/user.repository')
const { pagination, pageMeta } = require('../utils/validate')

/**
 * 当前登录用户信息（getUserInfo，style D）。
 * token 回填：源站登录响应内联 token；此处回填入参 token（签发登录本轮未实现）。
 */
async function userInfo(token) {
  const user = await userRepo.firstUser()
  if (!user) return null
  return {
    userinfo: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      mobile: user.mobile,
      avatar: user.avatar,
      score: user.score === null ? 0 : user.score,
      inviter_code: user.inviter_code || '',
      yao_count: user.yao_count === null ? 0 : user.yao_count,
      huifu_service_charge: user.huifu_service_charge === null ? 0 : user.huifu_service_charge,
      sandpay_service_charge: user.sandpay_service_charge === null ? 0 : user.sandpay_service_charge,
      token: token || '',
    },
  }
}

async function addressList(userId) {
  return await userRepo.listAddresses(userId).map((a) => ({
    address_id: a.id,
    name: a.name,
    mobile: a.mobile,
    province: a.province,
    city: a.city,
    area: a.area,
    address: a.address,
    is_default: a.is_default === null ? 0 : a.is_default,
  }))
}

/** 邀请信息（invitationInfo，style D） */
async function invitationInfo(userId) {
  const user = await userRepo.findUser(userId)
  const inviteNum = await userRepo.countInvitations(userId)
  const crystal = await userRepo.crystalNumber(userId)
  const code = user ? user.inviter_code || '' : ''
  return {
    invite_code: code,
    invite_num: inviteNum,
    invite_path: `/pages/invitation/invitation?code=${code}`,
    app_download_path: '',
    crystal_number: crystal,
  }
}

/** 邀请记录（invitationRecord，style C，列表键为 list） */
async function invitationRecord(userId, params) {
  const page = pagination(params, env)
  const { items, total } = await userRepo.listInvitations(userId, page)
  return {
    total,
    page: page.page,
    pageSize: page.pageSize,
    lastPage: pageMeta(total, page.page, page.pageSize).lastPage,
    items: items.map((r) => ({
      id: r.id,
      mobile: r.invitee_mobile || '',
      create_time: String(r.invite_time),
      status: r.status,
      remark: r.remark || '',
    })),
  }
}

module.exports = { userInfo, addressList, invitationInfo, invitationRecord }