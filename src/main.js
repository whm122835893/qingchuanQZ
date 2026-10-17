import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'
import { UniView, UniText, UniImage, UniScrollView, UniSwiper, UniSwiperItem } from './components/uni'
import { installUniShim } from './utils/uniShim'

const app = createApp(App)

// 原站为 uni-app，页面里直接调用 uni.showToast / uni.previewImage。
// 本项目是纯 Web，这里补一个最小 shim，保持页面调用方式不变。
installUniShim()

// 注册 uni-app 短标签组件（渲染为 uni-* 标签，配合 global.css 选择器）
app.component('view', UniView)
app.component('text', UniText)
app.component('image', UniImage)
app.component('scroll-view', UniScrollView)
app.component('swiper', UniSwiper)
app.component('swiper-item', UniSwiperItem)

app.use(createPinia())
app.use(router)
app.mount('#app')
