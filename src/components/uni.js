/**
 * uni-app 短标签组件映射
 * 原站模板使用 view / text / image / scroll-view 等短名（uni-app 编译前的写法），
 * 编译后为 uni-view / uni-text / uni-image / uni-scroll-view。
 * 这里注册同名短名组件，渲染为对应 uni-* 标签，保证 global.css 中的
 * `uni-view` / `uni-text` 等选择器继续生效。
 */
import { h } from 'vue'

/**
 * 透传所有属性与事件的包装器
 * @param {string} tag        渲染出的标签名
 * @param {string} [display] 额外的 display 值
 * @param {boolean} [wrapSpan] 是否用 <span> 包一层内容（对齐 uni-app 编译产物）
 */
function passthrough(tag, display, wrapSpan) {
  return {
    name: tag,
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      return () => {
        const children = slots.default ? slots.default() : []
        const props = { ...attrs }
        if (display) props.style = { ...(props.style || {}), display }
        return h(tag, props, wrapSpan ? [h('span', children)] : children)
      }
    },
  }
}

export const UniView = passthrough('uni-view')
export const UniText = {
  name: 'uni-text',
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    return () => {
      // uni-app 编译产物形如 <uni-text><span>文本</span></uni-text>。
      // Vue 模板编译会把元素间的缩进空白也作为文本节点传进 slot，
      // 而 uni-text 的 white-space 是 pre-line（空白保留 + 换行），
      // 这些空白会把文字挤成两行（实测「赛博」被压成 12px 宽、32px 高）。
      // 故这里剔除纯空白文本节点，只保留真实内容。
      const clean = (nodes) =>
        nodes.flatMap((n) => {
          if (typeof n === 'string') return n.trim() ? [n] : []
          if (n && typeof n === 'object' && n.type === 3) return n.children.trim() ? [n] : []
          return [n]
        })
      return h('uni-text', attrs, [h('span', clean(slots.default ? slots.default() : []))])
    }
  },
}
export const UniImage = passthrough('uni-image')
export const UniScrollView = {
  name: 'UniScrollView',
  inheritAttrs: false,
  props: {
    scrollX: { type: [Boolean, String], default: false },
    scrollY: { type: [Boolean, String], default: false },
    scrollTop: { type: [Number, String], default: undefined },
    scrollIntoView: { type: String, default: '' },
    showScrollbar: { type: [Boolean, String], default: false },
    upperThreshold: { type: [Number, String], default: 50 },
    lowerThreshold: { type: [Number, String], default: 50 },
    scrollWithAnimation: { type: [Boolean, String], default: false },
  },
  emits: ['scroll', 'scrolltolower', 'scrolltoupper'],
  setup(props, { slots, attrs, emit }) {
    const onScroll = (e) => {
      emit('scroll', e)
      const el = e.target
      // 触底 / 触顶（对应原站 scrolltolower / scrolltoupper）
      if (el.scrollHeight - el.scrollTop - el.clientHeight < Number(props.lowerThreshold)) {
        emit('scrolltolower', e)
      }
      if (el.scrollTop < Number(props.upperThreshold)) {
        emit('scrolltoupper', e)
      }
    }
    return () =>
      h(
        'uni-scroll-view',
        {
          ...attrs,
          'scroll-x': props.scrollX ? '' : undefined,
          'scroll-y': props.scrollY ? '' : undefined,
          'show-scrollbar': props.showScrollbar ? '' : undefined,
          onScroll,
        },
        [
          h('div.uni-scroll-view', {}, [
            h('div.uni-scroll-view', {}, [h('div.uni-scroll-view-content', {}, slots.default ? slots.default() : [])]),
          ]),
        ]
      )
  },
}
export const UniSwiper = passthrough('uni-swiper')
export const UniSwiperItem = passthrough('uni-swiper-item')