import { defineConfig } from 'vite';

// Own the complete static Atlas; the mature orbital simulator remains external.
export default defineConfig({
  base: '/Starsilk_Map_of_the_All/',
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    // Compress the Three.js renderer deterministically within the 225 KB cap.
    minify: 'terser',
    terserOptions: {compress: {passes: 2}},
    // Atlas targets browsers with native modulepreload and ES2022 support.
    // Keep Three.js separately cached while avoiding unused compatibility payload.
    target: 'es2022',
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if(id.includes('/node_modules/three/'))return 'three-vendor';
        },
      },
    },
  },
});
