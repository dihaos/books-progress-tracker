import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

// GitHub Pages: https://<user>.github.io/<repo>/ — в Actions задаётся GITHUB_REPOSITORY (owner/name).
// Репозиторий <user>.github.io (user/org site) публикуется в корне домена → base '/'.
const repository = process.env.GITHUB_REPOSITORY || ''
const owner = process.env.GITHUB_REPOSITORY_OWNER || ''
const repoName = repository.includes('/') ? repository.split('/')[1] : ''
const base =
  repoName && owner && repoName === `${owner}.github.io`
    ? '/'
    : repoName
      ? `/${repoName}/`
      : '/'

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
