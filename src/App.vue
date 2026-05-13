<script setup>
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import HomePage from '@/pages/HomePage.vue'
import ToastStack from '@/components/ToastStack.vue'
import ConfettiOverlay from '@/components/ConfettiOverlay.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import BookFormModal from '@/components/BookFormModal.vue'
import { useTheme } from '@/composables/useTheme.js'

const settingsOpen = ref(false)
const quickAddOpen = ref(false)

useTheme()

onMounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="min-h-full flex flex-col">
    <AppHeader
      @open-settings="settingsOpen = true"
      @add-book="quickAddOpen = true"
    />
    <HomePage />
    <ToastStack />
    <ConfettiOverlay />
    <SettingsPanel :open="settingsOpen" @close="settingsOpen = false" />
    <BookFormModal
      :open="quickAddOpen"
      :book-id="null"
      @close="quickAddOpen = false"
    />
  </div>
</template>
