import { defineConfig } from 'vite';

export default defineConfig({
  base: '/pacman/',
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
  },
});
