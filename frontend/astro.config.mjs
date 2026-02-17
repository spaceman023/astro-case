import { defineConfig } from 'astro/config';

export default defineConfig({
  server: { port: 3000 },
  vite: {
    server: {
      proxy: {
        '/api': 'http://localhost:8080',
      },
    },
  },
});
