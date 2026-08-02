import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { parseShardQR } from '../utils/qr';
import { saveShard } from '../storage/db';
import { validateShard } from '../core/sharding';
import { Activity, Clock, Shield, Database, Cpu, Search, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { safeInit, safeInterval } from '../core/stability';

/**
 * ShardNet Silent Relay Mode (Stealth Layer)
 * Visually appears as a System Monitor, but silently ingests shards in the background.
 */
const SilentRelay = () => {
  const navigate = useNavigate();
  const [relayCount, setRelayCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(45);
  const [uptime, setUptime] = useState('00:00:00');
  const [lastRelayTime, setLastRelayTime] = useState(null);
  
  const scannerRef = useRef(null);

  useEffect(() => {
    // Start System Monitor Clock (Battery Aware)
    const cleanupInterval = safeInterval(async () => {
      // Simulate fluctuating metrics
      setCpuUsage(prev => Math.max(5, Math.min(95, prev + (Math.random() * 10 - 5))));
      setMemUsage(prev => Math.max(30, Math.min(80, prev + (Math.random() * 4 - 2))));
      
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    const startTime = Date.now();

    // Initialize Background Scanner (Stealth) - Wrapped in safeInit
    safeInit("Stealth Relay Engine", () => {
      const scanner = new Html5QrcodeScanner("stealth-reader", { 
        fps: 5, 
        qrbox: { width: 1, height: 1 }, // Tiny scan box
        aspectRatio: 1.0
      });

      scanner.render(async (decodedText) => {
        try {
          const result = parseShardQR(decodedText);
          if (result && result.type === 'shard') {
            const shard = result.shard;
            if (validateShard(shard)) {
              const relayShard = {
                ...shard,
                isRelay: true,
                stealthMode: true,
                capturedAt: Date.now()
              };
              
              await saveShard(relayShard);
              setRelayCount(prev => prev + 1);
              setLastRelayTime(new Date().toLocaleTimeString());
            }
          }
        } catch (e) {
          // Silent fail
        }
      });
      scannerRef.current = scanner;
    });

    return () => {
      cleanupInterval();
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-emerald-500 font-mono p-6 space-y-8 select-none overflow-hidden">
      {/* ── TOP HEADER ────────────────────────────────────────────────── */}
      <header className="flex justify-between items-start border-b border-emerald-900/30 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="animate-pulse" />
            <h1 className="text-[14px] font-bold uppercase tracking-[0.3em]">SysMon v4.0.2-Relay</h1>
          </div>
          <p className="text-[14px] opacity-40 uppercase">Kernel: 5.15.0-76-generic</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="text-[14px] border border-emerald-900/50 px-3 py-1 rounded hover:bg-emerald-900/20 transition-all opacity-40 hover:opacity-100"
        >
          [ EXIT_DASH ]
        </button>
      </header>

      {/* ── CORE METRICS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard icon={<Activity size={12} />} label="CPU_LOAD" value={`${cpuUsage.toFixed(1)}%`} />
        <MetricCard icon={<Database size={12} />} label="MEM_USED" value={`${memUsage.toFixed(1)}%`} />
        <MetricCard icon={<Clock size={12} />} label="UPTIME" value={uptime} />
        <MetricCard icon={<Search size={12} />} label="ACTIVE_TASKS" value={Math.floor(cpuUsage / 2)} />
      </div>

      {/* ── LOG CONSOLE ───────────────────────────────────────────────── */}
      <div className="flex-1 bg-emerald-950/10 border border-emerald-900/20 rounded-lg p-4 space-y-2 min-h-[200px]">
        <div className="flex justify-between items-center border-b border-emerald-900/20 pb-2 mb-4">
          <span className="text-[14px] font-bold uppercase tracking-widest">Process_Relay_Logs</span>
          <span className="text-[14px] animate-pulse">● LIVE</span>
        </div>
        <LogLine text="Init system security protocols..." />
        <LogLine text="Daemon 'mesh_pulse_d' started [PID: 2842]" />
        <LogLine text="Listening on local interfaces..." />
        {lastRelayTime && (
          <LogLine 
            text={`Data packet ingested at ${lastRelayTime} [CRC_OK]`} 
            color="text-emerald-400" 
          />
        )}
        <LogLine text="Waiting for signal interactions..." />
        
        {/* The Stealth Scanner (Hidden/Obscured) */}
        <div id="stealth-reader" className="opacity-0 absolute pointer-events-none w-1 h-1 overflow-hidden" />
      </div>

      {/* ── FOOTER STATUS ─────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-black/90 backdrop-blur-sm border-t border-emerald-900/30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[14px] font-bold tracking-widest opacity-60">HEARTBEAT_ACTIVE</span>
        </div>
        <div className="text-[14px] opacity-40 uppercase tracking-widest font-bold">
          SECURE_NODE_RELAY: ACTIVE
        </div>
      </footer>
      
      {/* Visual background noise for authenticity */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="border border-emerald-900/20 p-4 rounded-lg bg-emerald-950/5 space-y-1">
    <div className="flex items-center gap-2 opacity-40">
      {icon}
      <span className="text-[14px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-bold tracking-tighter">{value}</div>
  </div>
);

const LogLine = ({ text, color = "text-emerald-900/60" }) => (
  <div className={`text-[14px] ${color}`}>
    <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
    {text}
  </div>
);

export default SilentRelay;
