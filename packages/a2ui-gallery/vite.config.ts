import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy the A2UI backend (example 27) so the browser talks same-origin,
    // avoiding CORS. Both the SSE stream and the action POST go through here.
    proxy: {
      '/agent-ui': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // SSE: don't buffer — stream chunks straight through.
        selfHandleResponse: false,
      },
    },
  },
});
