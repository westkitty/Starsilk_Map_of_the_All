import { defineConfig } from 'vite';

// This repository owns the Atlas; the orbital simulator is a separate application.
export default defineConfig({
  base: '/Starsilk_Map_of_the_All/',
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
});
