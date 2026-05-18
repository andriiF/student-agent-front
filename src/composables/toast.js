import { reactive } from 'vue'

export const toastState = reactive({
  message: '',
  visible: false
})

let hideTimer = null

/**
 * @param {string} message
 * @param {number} [durationMs=3200]
 */
export function toastSuccess(message, durationMs = 3200) {
  toastState.message = message
  toastState.visible = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    toastState.visible = false
    hideTimer = null
  }, durationMs)
}
