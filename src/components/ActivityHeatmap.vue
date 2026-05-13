<script setup>
import { computed, ref, reactive } from 'vue'
import { useStatistics } from '@/composables/useStatistics.js'
import { todayKey, formatLongDate, startOfWeek, addDays } from '@/utils/date.js'
import { pageLabel } from '@/utils/format.js'
import AppIcon from './AppIcon.vue'

const { heatmap } = useStatistics()

const weeks = computed(() => {
  const series = heatmap(119)
  const first = startOfWeek(series[0].date, 1)
  const today = series[series.length - 1].date
  const totalDays = Math.floor((today - first) / 86400000) + 1
  const totalWeeks = Math.ceil((totalDays + 1) / 7)

  const map = new Map(series.map((d) => [d.key, d]))
  const result = []
  for (let w = 0; w < totalWeeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, w * 7 + d)
      const key = todayKey(date)
      const isFuture = date > today
      const isPast = date < series[0].date
      const cell = map.get(key)
      week.push({
        key,
        date,
        value: cell?.value || 0,
        isFuture,
        isPast
      })
    }
    result.push(week)
  }
  return result
})

const monthLabels = computed(() => {
  const labels = []
  let lastMonth = -1
  weeks.value.forEach((w, i) => {
    const firstActive = w.find((c) => !c.isPast && !c.isFuture)
    const ref = firstActive || w[0]
    const m = ref.date.getMonth()
    if (m !== lastMonth) {
      lastMonth = m
      labels.push({ index: i, label: ref.date.toLocaleDateString('ru-RU', { month: 'short' }) })
    }
  })
  return labels
})

const maxValue = computed(() => {
  let m = 0
  weeks.value.forEach((w) => w.forEach((c) => (m = Math.max(m, c.value))))
  return m
})

function intensity(v) {
  if (!v) return 0
  if (maxValue.value <= 0) return 0
  const ratio = v / maxValue.value
  if (ratio < 0.18) return 1
  if (ratio < 0.4) return 2
  if (ratio < 0.7) return 3
  return 4
}

const activeDaysCount = computed(() => {
  let count = 0
  weeks.value.forEach((w) => w.forEach((c) => (!c.isPast && !c.isFuture && c.value > 0) && count++))
  return count
})

const tooltip = reactive({ visible: false, x: 0, y: 0, label: '', count: 0 })
const wrapRef = ref(null)

function showTooltip(event, cell) {
  if (cell.isFuture || cell.isPast) return
  tooltip.visible = true
  tooltip.label = formatLongDate(cell.date)
  tooltip.count = cell.value
  const containerRect = wrapRef.value.getBoundingClientRect()
  const rect = event.currentTarget.getBoundingClientRect()
  tooltip.x = rect.left - containerRect.left + rect.width / 2
  tooltip.y = rect.top - containerRect.top
}

function hideTooltip() {
  tooltip.visible = false
}
</script>

<template>
  <section id="activity" class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div class="card p-5 sm:p-6">
      <div class="flex items-baseline justify-between mb-4">
        <div>
          <h3 class="font-display text-lg font-semibold tracking-tight">Активность</h3>
          <p class="text-sm text-ink-500 dark:text-ink-300">
            Каждая ячейка — один день. Чем больше прочитано, тем ярче.
          </p>
        </div>
        <div class="hidden sm:flex items-center gap-2 text-xs text-ink-400">
          <AppIcon name="calendar" :size="14" />
          {{ activeDaysCount }} активных дней
        </div>
      </div>

      <div class="relative" ref="wrapRef">
        <div class="overflow-x-auto scroll-soft -mx-1 px-1 pb-1">
          <div>
            <div class="flex gap-[3px] pl-7 text-[10px] text-ink-400 mb-1">
              <template v-for="(w, i) in weeks" :key="`m-${i}`">
                <span
                  class="w-[14px] text-left"
                  :style="{ width: '14px' }"
                >
                  <span v-if="monthLabels.find((m) => m.index === i)">
                    {{ monthLabels.find((m) => m.index === i).label }}
                  </span>
                </span>
              </template>
            </div>

            <div class="flex gap-[3px]">
              <div class="flex flex-col justify-between text-[10px] text-ink-400 pr-2 py-[1px] w-5">
                <span>Пн</span>
                <span class="opacity-0">Вт</span>
                <span>Ср</span>
                <span class="opacity-0">Чт</span>
                <span>Пт</span>
                <span class="opacity-0">Сб</span>
                <span>Вс</span>
              </div>

              <div
                v-for="(w, wi) in weeks"
                :key="`w-${wi}`"
                class="flex flex-col gap-[3px]"
              >
                <button
                  v-for="cell in w"
                  :key="cell.key"
                  type="button"
                  class="w-[14px] h-[14px] rounded-[3px] transition-colors duration-150"
                  :class="[
                    cell.isFuture
                      ? 'bg-transparent border border-dashed border-ink-200/60 dark:border-ink-700/50 cursor-default'
                      : intensity(cell.value) === 0
                        ? 'bg-ink-100 dark:bg-ink-700/60 hover:bg-ink-200 dark:hover:bg-ink-700'
                        : intensity(cell.value) === 1
                          ? 'bg-sand-200 dark:bg-sand-500/30'
                          : intensity(cell.value) === 2
                            ? 'bg-sand-300 dark:bg-sand-500/50'
                            : intensity(cell.value) === 3
                              ? 'bg-sand-500 dark:bg-sand-500/75'
                              : 'bg-cocoa-600 dark:bg-sand-300'
                  ]"
                  :tabindex="cell.isFuture || cell.isPast ? -1 : 0"
                  :disabled="cell.isFuture || cell.isPast"
                  @mouseenter="(e) => showTooltip(e, cell)"
                  @mouseleave="hideTooltip"
                  @focus="(e) => showTooltip(e, cell)"
                  @blur="hideTooltip"
                />
              </div>
            </div>

            <div class="flex items-center justify-between mt-3">
              <div class="text-[11px] text-ink-400">
                Сегодня: {{ formatLongDate(new Date()) }}
              </div>
              <div class="flex items-center gap-1.5 text-[11px] text-ink-400">
                <span>меньше</span>
                <span class="w-[12px] h-[12px] rounded-[3px] bg-ink-100 dark:bg-ink-700/60" />
                <span class="w-[12px] h-[12px] rounded-[3px] bg-sand-200 dark:bg-sand-500/30" />
                <span class="w-[12px] h-[12px] rounded-[3px] bg-sand-300 dark:bg-sand-500/50" />
                <span class="w-[12px] h-[12px] rounded-[3px] bg-sand-500 dark:bg-sand-500/75" />
                <span class="w-[12px] h-[12px] rounded-[3px] bg-cocoa-600 dark:bg-sand-300" />
                <span>больше</span>
              </div>
            </div>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="tooltip.visible"
            class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full"
            :style="{ left: tooltip.x + 'px', top: tooltip.y - 6 + 'px' }"
          >
            <div class="glass-strong rounded-xl px-3 py-2 shadow-card text-xs whitespace-nowrap">
              <div class="font-medium">{{ tooltip.label }}</div>
              <div class="text-ink-500 dark:text-ink-300">
                <span v-if="tooltip.count > 0">
                  Прочитано
                  <span class="font-semibold text-sand-700 dark:text-sand-300">
                    {{ pageLabel(tooltip.count) }}
                  </span>
                </span>
                <span v-else>Пока нет отметок</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>
