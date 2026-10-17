'use strict'

/**
 * 社区域数据访问：community_posts / community_comments / chat_sessions / chat_messages。
 * 潮玩有话说（社区帖子）当前库中仅 1 帖 3 评论，按实际数据返回，不补造。
 */
const db = require('../db')

/** 帖子列表（含图片数组，images 为 JSON TEXT） */
function listPosts(page) {
  const total = db.count('SELECT COUNT(*) AS c FROM community_posts')
  const items = db.query(
    'SELECT id, user_id, nickname, avatar, content, create_time_str, images FROM community_posts ' +
      'ORDER BY id ASC' + db.dialect.limit(page.pageSize, page.offset)
  )
  return { items, total }
}

function findPost(id) {
  if (!id) return db.queryOne(
    'SELECT id, user_id, nickname, avatar, content, create_time_str, images FROM community_posts ORDER BY id ASC LIMIT 1'
  )
  return db.queryOne(
    'SELECT id, user_id, nickname, avatar, content, create_time_str, images FROM community_posts WHERE id = ?',
    [id]
  )
}

/** 评论：parent_id IS NULL 为一级评论，否则为回复 */
function listComments(postId) {
  if (!postId) return []
  return db.query(
    'SELECT id, post_id, parent_id, content, nickname, avatar, reply_nickname, reply_avatar, has_more, ' +
      'create_time_str FROM community_comments WHERE post_id = ? ORDER BY id ASC',
    [postId]
  )
}

/** 会话列表 */
function listSessions() {
  return db.query('SELECT id, name FROM chat_sessions ORDER BY id ASC')
}

/** 聊天消息（is_self 决定左右气泡） */
function listMessages(sessionId) {
  const w = sessionId ? ' WHERE session_id = ?' : ''
  const params = sessionId ? [sessionId] : []
  return db.query(
    'SELECT id, session_id, is_self, user_id, nickname, avatar, content, date_text, show_date ' +
      `FROM chat_messages${w} ORDER BY id ASC`,
    params
  )
}

module.exports = { listPosts, findPost, listComments, listSessions, listMessages }