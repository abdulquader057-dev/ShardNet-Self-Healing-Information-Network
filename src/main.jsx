import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { safeInit } from './core/stability'
import { globalInit } from './storage/db'
import 'leaflet/dist/leaflet.css';
import { registerSW } from 'virtual:pwa-register'

// 🛡️ Register Service Worker for Offline Mode
registerSW({ immediate: true });

// Start the hardened sequence with the requested safeBoot wrapper
window.safeBoot(async () => {
  // 1. Initialize Storage & Environment
  await window.safeInit("Storage Reliability", async () => {
    if (!localStorage.getItem('shardnet_init')) {
      localStorage.setItem('shardnet_init', Date.now().toString());
    }
    await globalInit(); // 🛡️ CRITICAL: ENSURE DB IS READY
  });

  // 2. Mount Root Application
  window.safeInit("Root UI Mount", () => {
    const root = document.getElementById('root');
    if (!root) throw new Error("Root element missing");
    
    try {
      const rootInstance = createRoot(root);
      rootInstance.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      
      // Mount Indicator for validation
      try {
        const indicator = document.createElement('div');
        indicator.id = 'react-mount-indicator';
        indicator.style.position = 'fixed';
        indicator.style.top = '10px';
        indicator.style.right = '10px';
        indicator.style.background = '#10b981';
        indicator.style.color = 'white';
        indicator.style.padding = '4px 10px';
        indicator.style.borderRadius = '99px';
        indicator.style.fontSize = '9px';
        indicator.style.fontWeight = 'bold';
        indicator.style.zIndex = '99999';
        indicator.innerText = "SYSTEM READY";
        document.body.appendChild(indicator);
      } catch(e) {}
    } catch (e) {
      console.error("Render failed", e);
      document.body.innerHTML = `<div style="background:black;color:red;padding:20px;font-family:monospace;">RENDER FAILURE: ${e.message}</div>`;
    }
    
    // Mark boot as potentially successful
    localStorage.setItem('sn_boot_fail_count', '0');
  });

  // 3. Nuclear Cache Recovery Check
  try {
    if (window.location.search.includes('reset=true')) {
      localStorage.clear();
      window.location.href = window.location.pathname;
    }
  } catch (e) {}
});

// 🛠️ DEBUG MODE ENABLE
localStorage.setItem("DEBUG", "true");
