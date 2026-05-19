<template>
  <div class="form-input">
    <label :for="inputId" class="form-input__label">{{ label }}</label>
    <input
      :id="inputId"
      v-model="model"
      class="form-input__control"
      :class="{ 'form-input__control--invalid': hasErrors }"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      v-bind="$attrs"
    />
    <p
      v-for="(message, index) in normalizedErrors"
      :key="index"
      class="form-input__error"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'

defineOptions({
  inheritAttrs: false
})

const model = defineModel({
  type: [String, Number],
  default: ''
})

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  id: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  errors: {
    type: [String, Array],
    default: () => []
  }
})

const generatedId = useId()
const inputId = computed(() => props.id || `form-input-${generatedId}`)

const normalizedErrors = computed(() => {
  if (Array.isArray(props.errors)) {
    return props.errors.filter(Boolean)
  }
  return props.errors ? [props.errors] : []
})

const hasErrors = computed(() => normalizedErrors.value.length > 0)
</script>
