/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleServerApi } from './src/serverApiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '4mb' }));

// Attach API and MCP endpoints
app.use((req, res, next) => {
  const handled = handleServerApi(req, res, next);
  if (!handled) {
    next();
  }
});

// Production static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Nexus Impact AI] Server listening on http://0.0.0.0:${PORT}`);
  console.log(`[Nexus Impact AI] MCP Streamable HTTP endpoint active at http://0.0.0.0:${PORT}/mcp`);
});
