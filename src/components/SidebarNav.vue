<template>
  <aside class="sidebar">
    <span class="nav-logo"></span>
    <div class="nav-tabs">
      <RouterLink  v-for="tab in tabs" :to="{'name': tab.id}" :key="tab.id">
        <button
            class="tab"
            :class="{ active: currentTab === tab.id }"
        >
          {{ tab.label }}
        </button>
      </RouterLink>
    </div>
  </aside>
</template>

<script setup>

import {ref} from "vue";

const tabs = [
  {id: 'dashboard', label: 'Główna'},
  {id: 'topic', label: 'Zestawy'},
]
const path = location.pathname.split('/');

const currentTab = ref(path[1] ?? 'dashboard');


defineEmits(['select-tab'])
</script>
