'use strict'

/**
 * 内容社区域数据访问：公告 / 公告类型 / 轮播 / 潮玩有话说 / 装修组件。
 */
const db = require('../db')
const { baseRepository } = require('./base.repository')

const affiches = baseRepository('affiches', [
  'id',
  'title',
  'image',
  'url',
  'type',
  'affiche_type',
  'view_count',
  'publish_time',
  'publish_time_ts',
  'content',
  'related_products',
])

/** 公告列表：type 对应 affiche_types.type（可空） */
function listAffiches({ type = null, page }) {
  const where = type ? 'type = ?' : ''
  const params = type ? [String(type)] : []
  const total = affiches.countBy(where, params)
  const items = db.query(
    'SELECT id, title, image, url, type, affiche_type, view_count, publish_time, publish_time_ts, content, related_products ' +
      `FROM affiches${where ? ` WHERE ${where}` : ''} ORDER BY publish_time_ts DESC, id DESC` +
      db.dialect.limit(page.pageSize, page.offset),
    params
  )
  return { items, total }
}

function findAffiche(id) {
  return affiches.findById(id)
}

const afficheTypes = baseRepository('affiche_types', ['id', 'name'])

function listAfficheTypes() {
  return afficheTypes.findAll('', [], 'id ASC')
}

const banners = baseRepository('banners', ['id', 'image', 'url', 'url_type', 'is_show'])

function listBanners(page) {
  const total = banners.countBy()
  const items = db.query(
    'SELECT id, image, url, url_type, is_show FROM banners ORDER BY id ASC' +
      db.dialect.limit(page.pageSize, page.offset)
  )
  return { items, total }
}

const newsArticles = baseRepository('news_articles', ['id', 'title', 'content', 'publish_time'])

function findNews(id) {
  return db.queryOne(
    'SELECT id, title, content, publish_time FROM news_articles WHERE id = ?',
    [id]
  )
}

/** 最新一篇（页面未传 id 时的兜底） */
function latestNews() {
  return db.queryOne(
    'SELECT id, title, content, publish_time FROM news_articles ORDER BY publish_time DESC, id DESC LIMIT 1'
  )
}

const diypageComponents = baseRepository('diypage_components', [
  'id',
  'type',
  'category',
  'name',
  'content',
  'decorate_id',
])

function listDiypage(category = null) {
  if (category) {
    return diypageComponents.findAll('category = ?', [category], 'id ASC')
  }
  return diypageComponents.findAll('', [], 'id ASC')
}

module.exports = {
  listAffiches,
  findAffiche,
  listAfficheTypes,
  listBanners,
  findNews,
  latestNews,
  listDiypage,
}
