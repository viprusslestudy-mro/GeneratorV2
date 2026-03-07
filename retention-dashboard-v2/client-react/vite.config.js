import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Собирает JS и CSS внутрь index.html
  ],
  build: {
    outDir: '../apps-script/src/dist', // Куда класть готовый билд
    emptyOutDir: true,
    assetsInlineLimit: 100000000 // Всегда инлайнить ассеты (картинки, шрифты)
  },
  server: {
    port: 5173
  }
});
