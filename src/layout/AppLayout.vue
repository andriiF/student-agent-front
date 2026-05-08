<template>
  <div class="app">
    <SidebarNav
      :tabs="tabs"
      :current-tab="currentTab"
      @select-tab="$emit('select-tab', $event)"
    />
    <div class="content">
      <header class="content-header">
        <div class="header-spacer"></div>
        <div class="nav-avatar" @click="$emit('open-profile')">{{ initials }}</div>
      </header>
      <slot />
    </div>
  </div>
</template>

<script setup>
import SidebarNav from '../components/SidebarNav.vue'

defineProps({
  tabs: { type: Array, required: true },
  currentTab: { type: String, required: true },
  initials: { type: String, required: true }
})

defineEmits(['select-tab', 'open-profile'])
</script>

<style scoped>
.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  display: flex;
  gap: 1.5rem;
}

.content {
  flex: 1;
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-spacer {
  min-height: 1px;
}

.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #EEEDFE;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  color: #3C3489;
  cursor: pointer;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
}

@media (max-width: 800px) {
  .app {
    flex-direction: column;
  }
}
</style>
