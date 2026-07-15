import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' so the bundle works on GitHub Pages under /tla-microwave/.
export default defineConfig({
  plugins: [react()],
  base: './',
});
