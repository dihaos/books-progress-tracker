import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// Production on REG.RU sets VITE_BASE_PATH=/ explicitly. The repository-based
// fallback keeps preview builds compatible with GitHub Pages when needed.
const repository = process.env.GITHUB_REPOSITORY || ''
const owner = process.env.GITHUB_REPOSITORY_OWNER || ''
const repoName = repository.includes('/') ? repository.split('/')[1] : ''
const explicitBase = process.env.VITE_BASE_PATH
const base = explicitBase || (
  repoName && owner && repoName === `${owner}.github.io`
    ? '/'
    : repoName
      ? `/${repoName}/`
      : '/'
)

export default defineConfig({
  base,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5174,
    open: true
  }
})
