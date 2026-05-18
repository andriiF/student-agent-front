<template>
  <div class="app">
    <SidebarNav/>
    <div class="content">
      <header class="content-header">
        <div class="header-spacer"></div>
        <RouterLink to="profile"><div class="nav-avatar">J</div></RouterLink>
      </header>
      <slot />
    </div>
  </div>
</template>

<script setup>
import SidebarNav from '@/components/SidebarNav.vue'

defineEmits(['select-tab', 'open-profile'])
</script>
