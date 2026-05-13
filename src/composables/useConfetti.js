import { reactive } from 'vue'

const state = reactive({
  bursts: []
})

let counter = 0
const COLORS = ['#ad8540', '#c7a35c', '#7b5a30', '#dcc28a', '#9a7440', '#503a1b']

function fire({ count = 90, duration = 2400 } = {}) {
  const id = ++counter
  const pieces = new Array(count).fill(0).map((_, i) => ({
    id: `${id}-${i}`,
    left: Math.random() * 100,
    delay: Math.random() * 250,
    duration: duration + Math.random() * 800,
    x: (Math.random() - 0.5) * 320,
    rotation: Math.random() * 720 - 360,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8
  }))
  state.bursts.push({ id, pieces })
  setTimeout(() => {
    const idx = state.bursts.findIndex((b) => b.id === id)
    if (idx !== -1) state.bursts.splice(idx, 1)
  }, duration + 1200)
}

export function useConfetti() {
  return { bursts: state.bursts, fire }
}
