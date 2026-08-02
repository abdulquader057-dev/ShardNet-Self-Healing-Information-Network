import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Inbox, Zap, Lock, Unlock,
  Navigation, Activity, Layers, ShieldAlert, CheckCircle2, Heart, X
} from 'lucide-react';
import {
  db, getAllMessages, getNodeIdentity,
  setVaultKey, clearVaultKey, isVaultLocked, clearAllData, saveMessage, saveShard
} from '../storage/db';
import { useNavigate } from 'react-router-dom';
import MeshMap from '../intelligence/mapModule';
import { EmergencyCard } from '../modules/EmergencyCard';
import { monitorBattery, initShakeDetection } from '../utils/survival';
import { safeInit, safeInterval, safeCall } from '../core/stability';
import { events } from '../core/events';
import { AudioEngine, Haptic } from '../core/feedback';
import { useMesh } from '../core/MeshProvider';

const Home = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ shardCount: 0, messageCount: 0 });
  const [nodeId, setNodeId] = useState('——');
  const [emergency, setEmergency] = useState(false);
  const { bytesTransferred } = useMesh();
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  useEffect(() => {
    safeInit("Home Page Init", () => {
      refresh();
      getNodeIdentity().then(id => {
        const strId = String(id).toUpperCase();
        setNodeId(strId.startsWith('NODE-') ? strId : `NODE-${strId.slice(0, 6)}`);
      });
      
      // 🔋 Critical Battery Auto-SOS
      monitorBattery(() => {
        if (window.location.pathname === '/') {
          navigate('/create?mode=sos&trigger=low_battery');
        }
      });

      // 🆘 Rapid Shake Detection
      initShakeDetection(() => {
        if (window.location.pathname === '/') {
          handleSOS();
        }
      });

      try {
        setVaultOpen(!isVaultLocked());
      } catch(e) {
        setVaultOpen(false);
      }
    });

    const stopRefresh = safeInterval(refresh, 15000);
    return () => safeCall(stopRefresh, "Refresh Cleanup");
  }, []);

  const refresh = async () => {
    try {
      const msgs = await getAllMessages();
      const shards = await db.shards.count();
      setMessages(msgs);
      setStats({ shardCount: shards, messageCount: msgs.length });
      setEmergency(msgs.some(m => m.category === 'Emergency' && Date.now() - m.reconstructedAt < 3600000));
    } catch (e) {
      console.warn("Refresh Failure:", e);
    }
  };

  const handleSOS = () => {
    AudioEngine.play('sos');
    Haptic.sos();
    
    // Broadcast signal via safe event bus
    events.emit('SOS_BROADCAST', { lat: 0, lng: 0, timestamp: Date.now() });
    navigate('/create?mode=sos');
  };

  const toggleVault = () => {
    try {
      if (isVaultLocked()) {
        const k = prompt('Enter Vault Key (or Duress PIN: 0000 to wipe):');
        if (k === '0000' || k === '9999') {
          clearAllData().then(() => {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: '🚨 DURESS TRIGGERED: ALL VAULT DATA WIPED' } }));
            refresh();
          });
          return;
        }
        if (k) setVaultKey(k);
      } else {
        clearVaultKey();
      }
      setVaultOpen(!isVaultLocked());
      refresh();
    } catch (e) {
      console.error("Vault interaction failed", e);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-container relative z-10 min-h-screen bg-[#0A0A0F] pb-48">
      
      {/* ── HEADER ── */}
      <header className="flex flex-col mb-8 gap-4">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">
            Shared<span className="text-[#0A84FF] not-italic">Net</span>
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1E] border border-slate-800 text-[9px] font-black uppercase tracking-widest text-[#0A84FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
              <span>MANUAL LINK</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1E] border border-slate-800 text-[9px] font-black uppercase tracking-widest ${emergency ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${emergency ? 'bg-[#FF3B30]' : 'bg-[#34C759]'}`} />
              <span>{emergency ? 'Alert' : 'Stable'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-y border-slate-800/80 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          <span>Node ID: <span className="text-slate-300 font-mono">{nodeId}</span></span>
          <span className="text-slate-500">Proximity Mesh System</span>
        </div>
      </header>

      {/* ── BENTO GRID SYSTEM ── */}
      <div className="bento-grid gap-4">
        
        {/* SOS CARD */}
        <div className="bento-col-8">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSOS}
            className="bento-card w-full h-full text-left min-h-[220px] bg-gradient-to-br from-[#FF3B30]/20 to-[#FF3B30]/5 border-[#FF3B30] hover:border-[#FF3B30]/80 group relative overflow-hidden shadow-[0_0_40px_rgba(255,59,48,0.2)]"
            data-label="SOS Distress Trigger"
          >
            <div className="absolute inset-0 bg-[#FF3B30]/[0.03] mix-blend-overlay" />
            <div className="absolute -inset-10 bg-gradient-to-r from-[#FF3B30]/10 to-transparent blur-3xl opacity-50 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-[#FF3B30]/20 rounded-2xl text-[#FF3B30] group-hover:scale-105 transition-transform duration-300">
                  <ShieldAlert size={28} />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#FF3B30]/15 border border-[#FF3B30]/30 rounded-full text-[#FF3B30] text-[9px] font-black uppercase tracking-widest animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" /> Priority Beacon
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white italic tracking-tight">EMERGENCY SOS</h3>
                <p className="text-xs font-semibold text-slate-300 max-w-md leading-relaxed">
                  Broadcast priority medical or distress beacon to all nearby nodes in the mesh. Operates offline without cellular infrastructure.
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* TELEMETRY CARD */}
        <div className="bento-col-4">
          <div className="bento-card justify-between min-h-[220px] border-slate-800 bg-[#1C1C1E]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telemetry</span>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">NETWORK INTEL</h3>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl text-primary">
                <Activity size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 my-2 border-y border-slate-800/80">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Shards</p>
                <p className="text-2xl font-black text-[#0A84FF] font-mono">{stats.shardCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reconstructed</p>
                <p className="text-2xl font-black text-[#34C759] font-mono">{stats.messageCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
              <span>Data Relayed</span>
              <span className="text-[#34C759]">{formatBytes(bytesTransferred.tx + bytesTransferred.rx)}</span>
            </div>
          </div>
        </div>

        {/* TACTICAL MAP INTEGRATED CARD */}
        <div className="bento-col-12">
          <div 
            className="bento-card relative overflow-hidden p-0 border-slate-800 bg-[#0a0a0c]"
            style={{ height: '280px' }}
            data-label="Bento Radar Map"
          >
            <div className="absolute top-4 left-4 z-20 bg-[#1C1C1E]/95 border border-slate-850 px-3 py-1.5 rounded-lg flex items-center gap-2 pointer-events-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white">Tactical Map</span>
            </div>

            <button 
              onClick={() => navigate('/pulse')}
              className="absolute top-4 right-4 z-20 bg-[#0A84FF] text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider hover:bg-[#0A84FF]/80 active:scale-95 transition-all pointer-events-auto shadow-md"
            >
              Expand Radar
            </button>

            {/* Render the full interactive leaflet map module within this card frame */}
            <div className="w-full h-full z-10">
              <MeshMap messages={messages} />
            </div>
          </div>
        </div>

        {/* INTEL DROP LINK */}
        <div className="bento-col-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/intel')}
            className="bento-card w-full h-full min-h-[140px] border-slate-800 bg-[#1C1C1E] text-left"
          >
            <div className="mb-4 text-[#0A84FF] bg-[#0A84FF]/10 w-fit p-3 rounded-2xl">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">INTEL DROP</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Share critical data</p>
          </motion.button>
        </div>

        {/* SAFE CHECK LINK */}
        <div className="bento-col-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/create?mode=safe')}
            className="bento-card w-full h-full min-h-[140px] border-slate-800 bg-[#1C1C1E] text-left"
          >
            <div className="mb-4 text-[#34C759] bg-[#34C759]/10 w-fit p-3 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">SAFE CHECK</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Update status</p>
          </motion.button>
        </div>

        {/* SURVIVAL KIT LINK */}
        <div className="bento-col-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/survival')}
            className="bento-card w-full h-full min-h-[140px] border-slate-800 bg-[#1C1C1E] text-left"
          >
            <div className="mb-4 text-rose-500 bg-rose-500/10 w-fit p-3 rounded-2xl">
              <Heart size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">SURVIVAL KIT</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">First Aid Kits</p>
          </motion.button>
        </div>

        {/* EXPLORE TACTICAL TOOLS COLLAPSIBLE TRIGGER */}
        <div className="bento-col-12">
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full py-4 bg-[#1C1C1E] border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-colors"
          >
            {showMore ? 'Collapse Tactical Tools' : 'Explore Tactical Tools'}
          </button>
        </div>

      </div>

      {/* COLLAPSIBLE TACTICAL PANEL */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 bento-grid gap-4"
          >
            <div className="bento-col-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/scan')}
                className="bento-card w-full border-slate-800 bg-[#1C1C1E] text-left h-full"
              >
                <div className="p-3 bg-white/5 w-fit rounded-xl mb-4 text-slate-400">
                  <QrCode size={20} />
                </div>
                <h4 className="font-bold text-white">INTERCEPT</h4>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Scan peer nodes</p>
              </motion.button>
            </div>

            <div className="bento-col-4">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/inbox')}
                className="bento-card w-full border-slate-800 bg-[#1C1C1E] text-left h-full"
              >
                <div className="p-3 bg-white/5 w-fit rounded-xl mb-4 text-slate-400">
                  <Inbox size={20} />
                </div>
                <h4 className="font-bold text-white">INTEL HUB</h4>
                <p className="text-[10px] font-medium text-slate-500 uppercase">Inbox & Records</p>
              </motion.button>
            </div>

            <div className="bento-col-4">
              <div className="bento-card border-slate-800 bg-[#1C1C1E] h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl ${vaultOpen ? 'bg-secondary/20 text-secondary' : 'bg-white/5 text-slate-500'}`}>
                    {vaultOpen ? <Unlock size={20} /> : <Lock size={20} />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-white leading-none">STEALTH VAULT</h4>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Encryption Active</p>
                  </div>
                </div>
                <button
                  onClick={toggleVault}
                  className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vaultOpen ? 'bg-[#34C759] text-white' : 'bg-white/5 border border-slate-800 text-slate-400'}`}
                >
                  {vaultOpen ? 'SECURE VAULT' : 'ACCESS VAULT'}
                </button>
              </div>
            </div>

            {/* System Status Details */}
            <div className="bento-col-12">
              <div className="bento-card flex-row items-center justify-between border-slate-800 bg-[#1C1C1E] py-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">System</p>
                    <p className="text-[11px] font-bold text-slate-300 uppercase">v2.7.6-S</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase">Sync Status</p>
                    <p className="text-[11px] font-bold text-[#34C759] uppercase">Encrypted</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowEmergencyCard(true)} className="btn-premium btn-primary !py-2 !px-4 !text-[9px]">MY PROFILE</button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <EmergencyCard isOpen={showEmergencyCard} onClose={() => setShowEmergencyCard(false)} />

    </div>
  );
};

export default Home;
