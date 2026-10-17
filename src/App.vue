<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['IndexPage', 'MarketPage', 'NoticePage', 'CommunityPage', 'MyPage']">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
</script>
