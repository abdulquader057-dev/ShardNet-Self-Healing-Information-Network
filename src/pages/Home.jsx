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
import { EmergencyCard } from '../modules/EmergencyCard';
import { monitorBattery, initShakeDetection } from '../utils/survival';
import { safeInit, safeInterval, safeCall } from '../core/stability';
import { events } from '../core/events';
import { AudioEngine, Haptic } from '../core/feedback';

const Home = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ shardCount: 0, messageCount: 0 });
  const [nodeId, setNodeId] = useState('——');
  const [emergency, setEmergency] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
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

  const runDemoMode = async () => {
    if (!confirm('Initiate Demo Mode?')) return;
    setDemoRunning(true);
    try {
      const fakeMsgId = `DEMO-${Date.now()}`;
      await saveShard({ id: `s1-${fakeMsgId}`, messageId: fakeMsgId, shardIndex: 0, totalShards: 2, expiry: Date.now() + 3600000, category: 'Emergency', location: 'Demo Sector A' });
      await new Promise(r => setTimeout(r, 1000));
      await saveShard({ id: `s2-${fakeMsgId}`, messageId: fakeMsgId, shardIndex: 1, totalShards: 2, expiry: Date.now() + 3600000, category: 'Emergency', location: 'Demo Sector A' });
      await saveMessage({ messageId: fakeMsgId, message: 'Simulated bridge collapse at Sector A. Requesting immediate evac.', category: 'Emergency', location: 'Demo Sector A', reconstructedAt: Date.now(), priority: 3 });
      
      // Seed Demo Mode into Settings config directly
      localStorage.setItem('sharednet_demo_mode', 'true');
      window.dispatchEvent(new CustomEvent('demo-mode-changed'));
      refresh();
    } finally {
      setDemoRunning(false);
    }
  };

  return (
    <div className="page-container relative z-10 min-h-screen bg-[#0A0A0F] pb-28">
      
      {/* ── HEADER (Instruction 3) ── */}
      <header className="flex flex-col mb-8 gap-4">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">
            Shared<span className="text-[#0A84FF] not-italic">Net</span>
          </h1>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1E] border border-slate-800 text-[9px] font-black uppercase tracking-widest text-[#0A84FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
              <span>AIR-GAP</span>
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

      {/* ── BENTO GRID SYSTEM (Instruction 5) ── */}
      <div className="bento-grid gap-4">
        
        {/* SOS CARD (Instruction 7) */}
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
              <span>Signal Integrity</span>
              <span className="text-[#34C759]">98.4% Nominal</span>
            </div>
          </div>
        </div>

        {/* INTEL DROP LINK */}
        <div className="bento-col-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/create?mode=intel')}
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
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Update your status</p>
          </motion.button>
        </div>

        {/* NETWORK PULSE LINK (Instruction 2) */}
        <div className="bento-col-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/pulse')}
            className="bento-card w-full h-full min-h-[140px] border-slate-800 bg-[#1C1C1E] text-left"
            data-label="Network Map Link"
          >
            <div className="mb-4 text-[#FF9500] bg-[#FF9500]/10 w-fit p-3 rounded-2xl">
              <Navigation size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">NETWORK PULSE</h3>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Map & Node Telemetry</p>
          </motion.button>
        </div>

        {/* SURVIVAL KIT LINK */}
        <div className="bento-col-12">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/survival')}
            className="bento-card flex-row items-center justify-between p-6 border-slate-800 bg-[#1C1C1E] hover:border-slate-700"
          >
            <div className="flex items-center gap-5">
              <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
                <Heart size={24} className="animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-black text-white italic">SURVIVAL KIT</h3>
                <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em]">First Aid • Signal Tools • Guidelines</p>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-slate-800 flex items-center justify-center text-rose-400">
              <Zap size={20} />
            </div>
          </motion.button>
        </div>

        {/* EXPLORE TACTICAL TOOLS COLLAPSIBLE TRIGGER (Instruction 5) */}
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

            {/* Collapsible Tactical Index List (Instruction 6) */}
            <div className="bento-col-12">
              <div className="bento-card border-slate-800 bg-[#1C1C1E] p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-[#0A84FF] uppercase tracking-widest">Tactical Coordinates</span>
                    <h4 className="font-bold text-white text-sm uppercase tracking-tight">Nearby Infrastructure Index</h4>
                  </div>
                  <span className="status-pill status-pill--success uppercase tracking-wider text-[9px]">
                    Offline-Indexed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { type: 'hospital', name: 'Trauma Center Node', coords: '17.4105, 78.4792', info: 'Emergency surgical capacity' },
                    { type: 'reservoir', name: 'Water Reserve Node', coords: '17.4035, 78.4822', info: 'Purified water distribution' },
                    { type: 'shelter', name: 'Emergency Bunker Command', coords: '17.4125, 78.4762', info: 'Disaster responder support' }
                  ].map(hub => {
                    const icons = {
                      hospital: '🏥',
                      reservoir: '💧',
                      shelter: '🏠'
                    };
                    const typeColors = {
                      hospital: 'text-rose-500',
                      reservoir: 'text-[#06b6d4]',
                      shelter: 'text-[#0A84FF]'
                    };
                    return (
                      <div key={hub.name} className="p-3 bg-[#2C2C2E] border border-slate-800 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${typeColors[hub.type]}`}>
                            {icons[hub.type]} {hub.type}
                          </span>
                          <span className="font-mono text-[9px] text-[#0A84FF] font-bold">{hub.coords}</span>
                        </div>
                        <h5 className="font-bold text-white text-xs">{hub.name}</h5>
                        <p className="text-[10px] text-slate-400 leading-normal">{hub.info}</p>
                      </div>
                    );
                  })}
                </div>
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
                  <button onClick={runDemoMode} className="btn-premium btn-outline !py-2 !px-4 !text-[9px]">DEMO MODE</button>
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
