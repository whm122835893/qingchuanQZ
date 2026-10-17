'use strict'

/**
 * 社区域 service：社区墙详情、潮玩有话说、聊天消息。
 */
const communityRepo = require('../repositories/community.repository')
const { jsonArray, bool } = require('../utils/pick')

/**
 * 社区墙详情（rumor/info，style D）。
 * comment_list 为一级评论，每条带reply 数组（被回复的评论挂在 reply 下）。
 */
async function rumorInfo(id) {
  const post = await communityRepo.findPost(id)
  if (!post) return null
  const comments = await communityRepo.listComments(post.id)
  const roots = comments.filter((c) => c.parent_id === null || c.parent_id === undefined)
  return {
    id: post.id,
    create_time: post.create_time_str || '',
    content: post.content || '',
    profile: { nickname: post.nickname || '', avatar: post.avatar || '' },
    images: jsonArray(post.images),
    comment_list: roots.map((c) => commentNode(c, comments)),
  }
}

function commentNode(c, all) {
  const children = all.filter((x) => x.parent_id === c.id)
  return {
    id: c.id,
    create_time: c.create_time_str || '',
    content: c.content || '',
    reply_id: 0,
    profile: { nickname: c.nickname || '', avatar: c.avatar || '' },
    reply_profile: { nickname: c.reply_nickname || c.nickname || '', avatar: c.reply_avatar || c.avatar || '' },
    reply: children.map((r) => ({
      id: r.id,
      create_time: r.create_time_str || '',
      content: r.content || '',
      reply_id: r.parent_id === null ? 0 : r.parent_id,
      profile: { nickname: r.nickname || '', avatar: r.avatar || '' },
      reply_profile: { nickname: r.reply_nickname || r.nickname || '', avatar: r.reply_avatar || r.avatar || '' },
    })),
    has_more: bool(c.has_more),
  }
}

/** 聊天消息（chat/messageList，style A）。is_self / show_date 源站为布尔 */
async function chatMessages(sessionId) {
  return await communityRepo.listMessages(sessionId).map((m) => ({
    id: m.id,
    is_self: bool(m.is_self),
    nickname: m.nickname || '',
    content: m.content || '',
    avatar: m.avatar || '',
    show_date: bool(m.show_date),
    date_text: m.date_text || '',
  }))
}

module.exports = { rumorInfo, chatMessages }