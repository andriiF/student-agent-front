<template>
  <aside class="sidebar">
    <span class="nav-logo"></span>
    <div class="nav-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: currentTab === tab.id }"
        @click="$emit('select-tab', tab.id)"
      >{{ tab.label }}</button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  tabs: { type: Array, required: true },
  currentTab: { type: String, required: true }
})

defineEmits(['select-tab'])
</script>

<style scoped>
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-logo {
  font-size: 18px;
  font-weight: 500;
}

.nav-tabs {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px;
}

.tab {
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  border: none;
  background: transparent;
  color: #6b6b6b;
  transition: all 0.15s;
}

.tab.active {
  background: #fff;
  color: #1a1a1a;
  font-weight: 500;
  border: 0.5px solid rgba(0, 0, 0, 0.12);
}

@media (max-width: 800px) {
  .sidebar {
    width: 100%;
  }

  .nav-tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tab {
    width: auto;
  }
}
</style>
