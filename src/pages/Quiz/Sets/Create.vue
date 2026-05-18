<template>
  <AppLayout>
    <div class="page-header">
      <div class="pick-title">Nowy zestaw</div>
      <div class="header-actions">
        <RouterLink :to="{ name: 'topic' }" class="btn-ghost">← Wróć</RouterLink>
      </div>
    </div>

    <form class="pick-wrap" @submit.prevent="submit">
      <div class="form-group">
        <label for="deck-name">Nazwa zestawu</label>
        <input
          id="deck-name"
          v-model="name"
          type="text"
          autocomplete="off"
          placeholder="np. Matura 2026"
          :disabled="loading"
          @keyup.enter="submit"
        />
        <p v-for="e in fieldErrors.name" :key="e" class="err">{{ e }}</p>
      </div>

      <p v-if="formError" class="err">{{ formError }}</p>

      <div class="new-quiz-actions">
        <button type="submit" class="btn-save" :disabled="loading || !name.trim()">
          {{ loading ? 'Zapisywanie…' : 'Zapisz' }}
        </button>
        <RouterLink :to="{ name: 'topic' }" class="btn-ghost">Anuluj</RouterLink>
      </div>
    </form>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createDeck } from '@/api/topics.js'
import { toastSuccess } from '@/composables/toast.js'
import AppLayout from '@/layout/AppLayout.vue'

const router = useRouter()
const name = ref('')
const loading = ref(false)
const formError = ref('')
const validationErrors = ref({})

const fieldErrors = computed(() => ({
  name: validationErrors.value.name || []
}))

async function submit() {
  if (loading.value || !name.value.trim()) return
  formError.value = ''
  validationErrors.value = {}
  loading.value = true

  try {
    const deck = await createDeck(name.value)
    toastSuccess('Utworzono zestaw.')
    const id = deck?.uuid ?? deck?.id
    if (id != null && String(id) !== '') {
      await router.push({ name: 'topic.edit', params: { id: String(id) } })
    } else {
      await router.push({ name: 'topic' })
    }
  } catch (e) {
    if (e?.errors && typeof e.errors === 'object') {
      validationErrors.value = e.errors
    }
    formError.value = e?.message || 'Nie udało się utworzyć zestawu.'
  } finally {
    loading.value = false
  }
}
</script>
