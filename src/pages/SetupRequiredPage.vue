<script setup>
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <div class="min-h-full flex items-center justify-center px-4 py-10">
    <div class="card w-full max-w-lg p-6 sm:p-8 shadow-card">
      <div class="flex items-center gap-3 mb-5">
        <span
          class="grid place-items-center w-10 h-10 rounded-xl
                 bg-gradient-to-br from-sand-500 to-cocoa-700 text-ink-50 shadow-glow"
        >
          <AppIcon name="warning" :size="18" />
        </span>
        <div>
          <h1 class="font-display text-xl font-semibold tracking-tight">Нужна настройка Supabase</h1>
          <p class="text-sm text-ink-500 dark:text-ink-300">Этап 1 — подключить облачную базу данных</p>
        </div>
      </div>

      <ol class="space-y-4 text-sm text-ink-700 dark:text-ink-200">
        <li class="flex gap-3">
          <span class="font-semibold text-sand-700 dark:text-sand-200">1.</span>
          <span>
            Создайте проект на
            <a href="https://supabase.com" target="_blank" rel="noreferrer" class="underline text-sand-800 dark:text-sand-200">supabase.com</a>
            (бесплатный план).
          </span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-sand-700 dark:text-sand-200">2.</span>
          <span>В SQL Editor выполните файл <code class="text-xs bg-ink-100 dark:bg-ink-900/50 px-1.5 py-0.5 rounded">supabase/schema.sql</code>.</span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-sand-700 dark:text-sand-200">3.</span>
          <span>
            Скопируйте <code class="text-xs bg-ink-100 dark:bg-ink-900/50 px-1.5 py-0.5 rounded">.env.example</code>
            в <code class="text-xs bg-ink-100 dark:bg-ink-900/50 px-1.5 py-0.5 rounded">.env.local</code>
            и вставьте URL и anon key из Supabase.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-sand-700 dark:text-sand-200">4.</span>
          <span>Перезапустите <code class="text-xs bg-ink-100 dark:bg-ink-900/50 px-1.5 py-0.5 rounded">npm run dev</code>.</span>
        </li>
      </ol>

      <p class="mt-6 text-xs text-ink-400">
        Подробная инструкция: <code>docs/SUPABASE_SETUP.md</code>
      </p>
    </div>
  </div>
</template>
