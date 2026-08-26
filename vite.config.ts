import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
//
// The entry HTML lives in web/ rather than the repository root.
//
// GitHub Pages is configured to deploy from a branch, so its builder publishes
// the repository root verbatim. With the Vite entry sitting there, the root
// index.html it served referenced /src/main.tsx, which does not exist once
// built, and every visitor got a blank page. Moving the entry frees the root so
// the compiled site can live there instead (see scripts/publish-root.mjs).
export default defineConfig({
  root: 'web',
  publicDir: '../public',
  base: './',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
})
