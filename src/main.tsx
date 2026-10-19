/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Manage PWA Service Worker:
// In Vite development mode or preview iframe, unregister any stale service workers
// so Vite unbundled modules load cleanly without cache interference.
// In production builds, register the service worker for offline field capability.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (k.includes('nexus-impact-shell')) {
            caches.delete(k);
          }
        });
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration failed:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
