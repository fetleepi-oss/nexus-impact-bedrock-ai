import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleServerApi } from './src/serverApiHandler.ts';

function nexusApiPlugin(): Plugin {
  return {
    name: 'nexus-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const handled = handleServerApi(req, res, next);
        if (!handled) {
          next();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), nexusApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
