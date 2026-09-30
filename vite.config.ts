import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // The backend's CORS only allows FRONTEND_URL (localhost:3000); fail loudly
    // instead of silently moving to 3001 where every API call would be blocked.
    strictPort: true,
    open: true
  }
});
