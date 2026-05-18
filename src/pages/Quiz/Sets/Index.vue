<template>
  <AppLayout>
    <div class="page-header">
      <div class="pick-title">Zestawy</div>
      <div class="header-actions">
        <RouterLink :to="{'name':'topic.create'}">
          <button class="btn-sec">+ Dodaj nowy zestaw</button>
        </RouterLink>
      </div>
    </div>

    <div v-if="decksError" class="empty-state">{{ decksError }}</div>
    <div v-else-if="decksLoading" class="empty-state">Ładowanie zestawów…</div>
    <div v-else class="pick-wrap">
      <RouterLink v-for="(deck, i) in decks"
                  class="pick-item"
                  :key="deck.uuid ?? `deck-${i}`"
                  :to="{'name':'topic.edit', params:{id:deck.uuid}}">

        <span>{{ deck.name }}</span>
        <span class="pick-meta">{{ (deck.quizzes || []).length }} quizów</span>
      </RouterLink>
    </div>
  </AppLayout>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { fetchDecks } from '@/api/topics.js'
import AppLayout from "@/layout/AppLayout.vue";

defineEmits(['go'])

const router = useRouter()
const decks = ref([])
const decksLoading = ref(false)
const decksError = ref('')
const showNewSetForm = ref(false)


onMounted(async () => {
  decksError.value = ''
  decksLoading.value = true
  try {
    decks.value = await fetchDecks()
  } catch (e) {
    decksError.value = e?.message || 'Nie udało się pobrać zestawów.'
  } finally {
    decksLoading.value = false
  }
})

function selectDeck(i) {
  router.replace({name: 'set-edit', params: {id: i}})
}


</script>

