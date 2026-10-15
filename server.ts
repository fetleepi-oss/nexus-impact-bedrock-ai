/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { handleServerApi } from './src/serverApiHandler.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Trust proxy header from Render / load balancers for accurate client IP rate limiting
app.set('trust proxy', 1);

// Body parsing with limit
app.use(express.json({ limit: '4mb' }));

// Attach Bedrock API, Health, and Streamable HTTP MCP endpoints
app.use((req, res, next) => {
  const handled = handleServerApi(req, res, next);
  if (!handled) {
    next();
  }
});

// Resolve dist path without __dirname or __filename (safe for bundled ESM output)
const distDir = path.join(process.cwd(), 'dist');

async function setupServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  // In production (or when dist exists), serve built static assets with index.html fallback
  if (isProduction || fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      // Don't intercept API or MCP requests
      if (req.url.startsWith('/api') || req.url.startsWith('/mcp')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    // Only import and mount Vite in development mode when dist is not built
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('[Nexus Impact AI] Vite dev middleware not mounted:', e);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nexus Impact AI] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Nexus Impact AI] MCP Streamable HTTP endpoint active at http://0.0.0.0:${PORT}/mcp`);
    console.log(`[Nexus Impact AI] Health check endpoint active at http://0.0.0.0:${PORT}/api/health`);
  });
}

setupServer().catch((err) => {
  console.error('[Nexus Impact AI] Fatal server startup error:', err);
  process.exit(1);
});
