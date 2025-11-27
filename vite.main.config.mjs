import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      // Prevent bundling of native dependencies that can break when
      // initialized before Electron loads them in the main process.
      external: ['pg', 'pg-native'],
    },
  },
});
