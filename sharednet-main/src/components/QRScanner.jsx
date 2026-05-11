import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Zap, Info, Scan, Terminal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';

export default function QRScanner({ onComplete }) {
  const { addShard } = useStore();
  const [log, setLog] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const regionId = "reader";

  const addLog = (msg) => {
    setLog(prev => [{ id: Date.now(), msg }, ...prev].slice(0, 5));
  };

  useEffect(() => {
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode(regionId);
        setIsScanning(true);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            try {
              const shard = JSON.parse(decodedText);
              if (shard.shardId && shard.messageId) {
                addShard(shard);
                addLog(`√ RECEIVED SHARD: ${shard.shardId.substring(0, 12)}...`);
                // Vibration feedback if supported
                if (window.navigator.vibrate) window.navigator.vibrate(100);
              }
            } catch (e) {
              console.error("Invalid QR payload", e);
            }
          },
          (errorMessage) => {
            // silent fail for frame misses
          }
        );
      } catch (err) {
        console.error("Camera fail", err);
        addLog("! CAMERA ERROR: ACCESS DENIED");
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Scanner cleanup fail", err));
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onComplete} className="p-1 -ml-1 text-zinc-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-black text-white tracking-tighter uppercase">Intercept_Data</h2>
      </div>

      <div className="relative aspect-square w-full max-w-[300px] mx-auto rounded-lg overflow-hidden bg-black border border-zinc-800">
        <div id={regionId} className="w-full h-full" />
        
        {/* Overlay Decoration */}
        <div className="absolute inset-0 pointer-events-none border border-emerald-500/10 m-12 rounded">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500" />
          
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-emerald-500/20 animate-pulse" />
        </div>

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-emerald-500/50 gap-4 p-8 text-center">
            <Zap className="w-10 h-10 animate-pulse" />
            <p className="text-[10px] font-black tracking-[0.2em] uppercase">Initializing_Optical_Sensors...</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">
          <Terminal className="w-3 h-3 text-emerald-500" />
          Ingestion_Log
        </div>
        
        <div className="bg-black border border-zinc-800 rounded-sm p-4 min-h-[140px] font-mono text-[10px] space-y-1 overflow-hidden">
          <AnimatePresence initial={false}>
            {log.length === 0 ? (
              <p className="text-zinc-800 italic uppercase tracking-widest">Waiting for packet ingress...</p>
            ) : (
              log.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-emerald-500 flex gap-2 font-bold"
                >
                  <span className="text-zinc-700">[{new Date(entry.id).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  {entry.msg}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded flex gap-4 items-start shadow-inner">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-snug text-zinc-500 font-bold uppercase tracking-tight">
          Point optics at SHARDNET QR. Auto-merge logic active. Node will vibrate on successful packet capture.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-sm font-black text-zinc-400 active:scale-95 transition-all text-xs tracking-widest uppercase hover:bg-zinc-800 hover:text-white"
      >
        TERMINATE_SESSION
      </button>
    </div>
  );
}
