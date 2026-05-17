import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// Service Worker — safe registration with stale-cache protection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        // Force update check on every load to prevent stale cache white screens
        reg.update();
      })
      .catch(() => {});

    // If SW causes issues (stale cache), expose emergency clear function
    window.__clearSWCache = async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
      window.location.reload(true);
    };
  });
}
