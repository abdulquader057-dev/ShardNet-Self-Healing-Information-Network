import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Bluetooth, Wifi, QrCode, HardDrive, Smartphone, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function OfflineShare() {
  const [mode, setMode] = useState('menu'); // menu | qr | airdrop
  const [shareStatus, setShareStatus] = useState('');

  // The actual URL of the deployed app, or local IP if testing locally
  const appUrl = window.location.origin;

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SharedNet - Offline Mesh App',
          text: 'Install the SharedNet offline mesh communication app. Works via WebRTC and Bluetooth.',
          url: appUrl,
        });
        setShareStatus('success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Share failed", err);
          setMode('qr'); // Fallback
        }
      }
    } else {
      // Fallback to QR if Web Share not supported
      setMode('qr');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-48 px-6 pt-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-white flex items-center gap-3">
            <HardDrive className="text-[#0A84FF]" size={28} />
            Offline Install
          </h1>
          <p className="text-body-sm text-slate-400">Share SharedNet without internet</p>
        </div>
      </div>

      {mode === 'menu' && (
        <div className="space-y-4">
          <div className="bento-card p-6 border-slate-800 space-y-4 bg-[#1C1C1E]">
            <p className="text-sm text-slate-300">
              SharedNet is a Progressive Web App (PWA). You can share it directly to nearby devices using native sharing protocols (AirDrop, Nearby Share) or a QR code.
            </p>
            
            <button 
              onClick={handleWebShare}
              className="btn-premium w-full bg-[#0A84FF] text-white flex items-center justify-center gap-2"
            >
              <Bluetooth size={18} />
              <Wifi size={18} className="-ml-2" />
              AirDrop / Nearby Share
            </button>
            
            <button 
              onClick={() => setMode('qr')}
              className="btn-premium w-full btn-outline flex items-center justify-center gap-2"
            >
              <QrCode size={18} />
              Show QR Code
            </button>
          </div>

          <div className="bento-card p-6 border-slate-800 space-y-4 bg-[#1C1C1E]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">How to install offline</h3>
            <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside">
              <li>Connect the other device to the same local WiFi network or Hotspot.</li>
              <li>Scan the QR code or accept the AirDrop transfer.</li>
              <li>Once opened in the browser, tap "Add to Home Screen".</li>
              <li>The Service Worker will cache the entire app instantly for offline use.</li>
            </ol>
          </div>
        </div>
      )}

      {mode === 'qr' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-card p-6 flex flex-col items-center gap-6"
        >
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-white">Scan to Install</h3>
            <p className="text-xs text-slate-500">Requires local network connection</p>
          </div>
          
          <div className="p-4 bg-white rounded-2xl">
            <QRCodeSVG value={appUrl} size={220} level="H" />
          </div>
          
          <p className="text-[10px] font-mono text-slate-400 break-all text-center">
            {appUrl}
          </p>

          <button onClick={() => setMode('menu')} className="btn-premium btn-outline w-full mt-2">
            BACK
          </button>
        </motion.div>
      )}
      
      {shareStatus === 'success' && (
        <div className="p-4 bg-[#34C759]/10 border border-[#34C759]/30 rounded-xl flex items-center gap-3 text-[#34C759]">
          <CheckCircle2 size={24} />
          <p className="text-sm font-bold">App link shared successfully!</p>
        </div>
      )}
    </div>
  );
}
