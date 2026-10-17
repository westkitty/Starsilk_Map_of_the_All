import { defineConfig } from 'vite';

// Own the complete static Atlas; the mature orbital simulator remains external.
export default defineConfig({
  base: '/Starsilk_Map_of_the_All/',
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if(id.includes('/node_modules/three/'))return 'three-vendor';
        },
      },
    },
  },
});
