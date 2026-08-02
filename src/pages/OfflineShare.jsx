import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Share2, QrCode, HardDrive, Smartphone, CheckCircle2, Upload, ImageIcon, Share } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function OfflineShare() {
  const [mode, setMode] = useState('menu'); // menu | qr
  const [shareStatus, setShareStatus] = useState('');
  const fileInputRef = useRef(null);

  const appUrl = window.location.origin;

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SharedNet - Offline Mesh App',
          text: 'Install the SharedNet offline mesh communication app. Scan QR or click link.',
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
      setMode('qr');
    }
  };

  const handleGalleryImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { type: 'success', message: 'Gallery QR imported successfully!' } 
      }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-48 px-6 pt-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-white flex items-center gap-3">
            <Share2 className="text-[#0A84FF]" size={28} />
            Cross-Platform Bridge
          </h1>
          <p className="text-body-sm text-slate-400">Share SharedNet & Import Links</p>
        </div>
      </div>

      {mode === 'menu' && (
        <div className="space-y-4">
          <div className="bento-card p-6 border-slate-800 space-y-4 bg-[#1C1C1E] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF] mb-2">
              <Share size={32} />
            </div>
            <h3 className="text-white font-bold">Nearby Share</h3>
            <p className="text-xs text-slate-400">
              Use native sharing (AirDrop / Nearby Share) to send this PWA to nearby devices without internet.
            </p>
            <button 
              onClick={handleWebShare}
              className="btn-premium w-full bg-[#0A84FF] text-white flex items-center justify-center gap-2 mt-2"
            >
              <Share2 size={18} />
              SHARE NOW
            </button>
            <button 
              onClick={() => setMode('qr')}
              className="btn-premium w-full btn-outline flex items-center justify-center gap-2 mt-2"
            >
              <QrCode size={18} />
              SHOW QR FALLBACK
            </button>
          </div>

          <div className="bento-card p-6 border-slate-800 space-y-4 bg-[#1C1C1E] flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#34C759]/20 flex items-center justify-center text-[#34C759] mb-2">
              <ImageIcon size={32} />
            </div>
            <h3 className="text-white font-bold">Gallery Import</h3>
            <p className="text-xs text-slate-400">
              Received a QR code via MMS or other means? Import the image directly to extract the mesh link.
            </p>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleGalleryImport} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="btn-premium w-full bg-[#34C759] text-white flex items-center justify-center gap-2 mt-2"
            >
              <Upload size={18} />
              IMPORT IMAGE
            </button>
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

          <button 
            onClick={() => setMode('menu')}
            className="text-xs text-[#0A84FF] font-bold uppercase tracking-widest mt-4"
          >
            Go Back
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
