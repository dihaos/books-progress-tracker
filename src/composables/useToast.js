import { reactive } from 'vue'

const state = reactive({
  toasts: []
})

let counter = 0

function push(toast) {
  const id = ++counter
  const item = {
    id,
    type: toast.type || 'info',
    title: toast.title || '',
    message: toast.message || '',
    duration: toast.duration ?? 3200
  }
  state.toasts.push(item)
  if (item.duration > 0) {
    setTimeout(() => dismiss(id), item.duration)
  }
  return id
}

function dismiss(id) {
  const idx = state.toasts.findIndex((t) => t.id === id)
  if (idx !== -1) state.toasts.splice(idx, 1)
}

export function useToast() {
  return {
    toasts: state.toasts,
    push,
    dismiss,
    success: (message, title = 'Готово') => push({ type: 'success', title, message }),
    error: (message, title = 'Ошибка') => push({ type: 'error', title, message }),
    info: (message, title = '') => push({ type: 'info', title, message })
  }
}
