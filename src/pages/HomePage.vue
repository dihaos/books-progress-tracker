<script setup>
import HeroSection from '@/components/HeroSection.vue'
import DailyFocusStats from '@/components/DailyFocusStats.vue'
import HomeGoalsBlock from '@/components/HomeGoalsBlock.vue'
import ActivityHeatmap from '@/components/ActivityHeatmap.vue'

defineEmits(['open-book', 'add-book', 'manage-goals', 'create-goal'])
</script>

<template>
  <main id="top">
    <HeroSection @add-book="emit('add-book')" />

    <DailyFocusStats />

    <HomeGoalsBlock
      @select-book="emit('open-book', $event)"
      @manage-goals="emit('manage-goals')"
      @create-goal="emit('create-goal')"
    />

    <ActivityHeatmap />

    <footer class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 text-center text-xs text-ink-400">
      <div class="divider mb-6" />
      <p>Сделано с заботой. Каждая страница — кирпичик в твоей библиотеке.</p>
    </footer>
  </main>
</template>
