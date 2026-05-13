<script setup>
import { useConfetti } from '@/composables/useConfetti.js'

const { bursts } = useConfetti()
</script>

<template>
  <div class="fixed inset-0 z-[55] pointer-events-none overflow-hidden" aria-hidden="true">
    <template v-for="burst in bursts" :key="burst.id">
      <span
        v-for="p in burst.pieces"
        :key="p.id"
        class="confetti-piece"
        :style="{
          left: p.left + '%',
          backgroundColor: p.color,
          width: p.size + 'px',
          height: p.size * 1.6 + 'px',
          animationDelay: p.delay + 'ms',
          '--duration': p.duration + 'ms',
          '--x': p.x + 'px',
          '--r': p.rotation + 'deg'
        }"
      />
    </template>
  </div>
</template>
