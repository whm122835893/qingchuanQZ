<template>
  <!--
    原站 my/enablingcenter 的 render function 只返回一个空 div：
    `var n=this.$createElement,t=this._self._c||n;return t("div")`
    即该页面在原站就是一个未开放的空壳页（既无导航也无内容）。
    按 P0 规则「结构严格按原站」，此处保留为空页，不做任何补写。
  -->
  <view class="enabling-center-page"></view>
</template>

<script setup>
defineOptions({ name: 'EnablingCenterPage' })
</script>

<style scoped>
.enabling-center-page {
  min-height: 100vh;
  background: #f4f6fa;
}
</style>
