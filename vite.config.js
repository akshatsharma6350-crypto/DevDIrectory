import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/DevDirectory/',
  server: { port: 5173 },
  preview: { port: 4173 },
});