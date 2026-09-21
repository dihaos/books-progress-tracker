<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useAuth } from '@/composables/useAuth.js'

const emit = defineEmits(['success'])
const { signIn, signUp } = useAuth()

const mode = ref('login')
const email = ref('')
const password = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  message.value = ''

  const trimmedEmail = email.value.trim()
  if (!trimmedEmail || !password.value) {
    error.value = 'Введите email и пароль'
    return
  }

  busy.value = true
  try {
    if (mode.value === 'login') {
      await signIn(trimmedEmail, password.value)
      emit('success')
      return
    }

    const result = await signUp(trimmedEmail, password.value)
    if (result.session) {
      emit('success')
      return
    }

    message.value =
      'Аккаунт создан. Если Supabase просит подтвердить email — проверьте почту, затем войдите.'
    mode.value = 'login'
  } catch (err) {
    error.value = err.message || 'Не удалось выполнить вход'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="min-h-full flex items-center justify-center px-4 py-10">
    <div class="card w-full max-w-md p-6 sm:p-8 shadow-card">
      <div class="flex items-center gap-3 mb-6">
        <span
          class="grid place-items-center w-10 h-10 rounded-xl
                 bg-gradient-to-br from-sand-500 to-cocoa-700 text-ink-50 shadow-glow"
        >
          <AppIcon name="book" :size="18" />
        </span>
        <div>
          <h1 class="font-display text-xl font-semibold tracking-tight">Library</h1>
          <p class="text-sm text-ink-500 dark:text-ink-300">Войдите, чтобы синхронизировать книги</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-5">
        <button
          type="button"
          class="btn h-10"
          :class="mode === 'login'
            ? 'bg-sand-100 text-sand-900 dark:bg-sand-500/15 dark:text-sand-100'
            : 'btn-soft'"
          @click="mode = 'login'"
        >
          Вход
        </button>
        <button
          type="button"
          class="btn h-10"
          :class="mode === 'register'
            ? 'bg-sand-100 text-sand-900 dark:bg-sand-500/15 dark:text-sand-100'
            : 'btn-soft'"
          @click="mode = 'register'"
        >
          Регистрация
        </button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block">
          <span class="label mb-1.5 block">Email</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="input w-full"
            placeholder="you@example.com"
          />
        </label>

        <label class="block">
          <span class="label mb-1.5 block">Пароль</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="input w-full"
            placeholder="Минимум 6 символов"
          />
        </label>

        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        <p v-if="message" class="text-sm text-sand-700 dark:text-sand-200">{{ message }}</p>

        <button type="submit" class="btn-primary w-full h-11" :disabled="busy">
          {{ busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт' }}
        </button>
      </form>

      <p class="mt-5 text-xs text-ink-400 leading-relaxed">
        Данные хранятся в облаке Supabase и доступны с любого устройства после входа в тот же аккаунт.
      </p>
    </div>
  </div>
</template>
