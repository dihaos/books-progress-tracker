import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import state from '@/stores/booksStore.js'

const mql =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function apply(theme) {
  if (typeof document === 'undefined') return
  const isDark =
    theme === 'dark' || (theme === 'system' && mql && mql.matches)
  document.documentElement.classList.toggle('dark', !!isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function useTheme() {
  const theme = computed({
    get: () => state.settings.theme,
    set: (v) => {
      state.settings.theme = v
    }
  })

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return !!(mql && mql.matches)
  })

  function cycle() {
    const next =
      theme.value === 'light'
        ? 'dark'
        : theme.value === 'dark'
          ? 'system'
          : 'light'
    theme.value = next
  }

  function setTheme(value) {
    theme.value = value
  }

  let mqlHandler = null
  onMounted(() => {
    apply(theme.value)
    if (mql) {
      mqlHandler = () => {
        if (theme.value === 'system') apply('system')
      }
      mql.addEventListener?.('change', mqlHandler)
    }
  })

  onBeforeUnmount(() => {
    if (mql && mqlHandler) {
      mql.removeEventListener?.('change', mqlHandler)
      mqlHandler = null
    }
  })

  watch(theme, (v) => apply(v), { immediate: false })

  return { theme, isDark, setTheme, cycle }
}
