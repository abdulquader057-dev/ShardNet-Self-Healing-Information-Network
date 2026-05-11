import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Inbox, Zap, Radio, Mic, Lock, Unlock,
  Navigation, Signal, Cpu, Activity, Layers, ShieldAlert, CheckCircle2, FileText, Play, Bluetooth, Heart
} from 'lucide-react';
import {
  db, getAllMessages, getNodeIdentity,
  setVaultKey, clearVaultKey, isVaultLocked, clearAllData, saveMessage, saveShard
} from '../storage/db';
import { useNavigate } from 'react-router-dom';
import MeshMap from '../intelligence/mapModule';
import FlashTransmitter from '../intelligence/flashTransfer';
import { EmergencyCard } from '../modules/EmergencyCard';
import { monitorBattery, initShakeDetection } from '../utils/survival';
import { safeInit, safeInterval, DEMO_MODE, safeCall } from '../core/stability';
import { events, MESH_EVENTS } from '../core/events';

const Home = () => {
  const navigate   = useNavigate();
  const [messages, setMessages] = useState([]);
  const [stats,  setStats]  = useState({ shardCount: 0, messageCount: 0 });
  const [nodeId, setNodeId] = useState('——');
  const [emergency, setEmergency] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [showEmergencyCard, setShowEmergencyCard] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  useEffect(() => {
    safeInit("Home Page Init", () => {
      refresh();
      getNodeIdentity().then(id => setNodeId(String(id).slice(0, 10)));
      
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
      const msgs   = await getAllMessages();
      const shards = await db.shards.count();
      setMessages(msgs);
      setStats({ shardCount: shards, messageCount: msgs.length });
      setEmergency(msgs.some(m => m.category === 'Emergency' && Date.now() - m.reconstructedAt < 3600000));
    } catch (e) {
      console.warn("Refresh Failure:", e);
    }
  };

  const handleSOS = () => {
    if(navigator.vibrate) navigator.vibrate([200,100,200]);
    
    // Broadcast signal via safe event bus
    events.emit('SOS_BROADCAST', { lat: 0, lng: 0, timestamp: Date.now() });

    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      navigate('/create?mode=sos');
    }, 2500);
  };

  const toggleVault = () => {
    try {
      if (isVaultLocked()) {
        const k = prompt('Enter Vault Key (or Duress PIN: 0000 to wipe):');
        if (k === '0000' || k === '9999') {
          clearAllData().then(() => {
            alert('🚨 DURESS TRIGGERED: DATA WIPED');
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
    if(!confirm('Initiate Demo Mode?')) return;
    setDemoRunning(true);
    try {
      const fakeMsgId = `DEMO-${Date.now()}`;
      await saveShard({ id: `s1-${fakeMsgId}`, messageId: fakeMsgId, shardIndex: 0, totalShards: 2, expiry: Date.now() + 3600000, category: 'Emergency', location: 'Demo Sector A' });
      await new Promise(r => setTimeout(r, 1000));
      await saveShard({ id: `s2-${fakeMsgId}`, messageId: fakeMsgId, shardIndex: 1, totalShards: 2, expiry: Date.now() + 3600000, category: 'Emergency', location: 'Demo Sector A' });
      await saveMessage({ messageId: fakeMsgId, message: 'Simulated bridge collapse at Sector A. Requesting immediate evac.', category: 'Emergency', location: 'Demo Sector A', reconstructedAt: Date.now(), priority: 3 });
      refresh();
    } finally {
      setDemoRunning(false);
    }
  };

  const card = (extra = {}) => ({
    borderRadius: 0,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)',
    ...extra,
  });
  return (
    <div className="app-container">
      <div className="noise-overlay" />
      
      {/* ── BACKGROUND MAP LAYER ── */}
      <div className="map-layer">
        <MeshMap messages={messages} />
        <div className="absolute inset-0 z-0 pointer-events-none bg-background/20" />
        
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
           <div className="w-full h-full border border-primary/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        </div>
        
        <div className="absolute top-6 right-6 flex items-center gap-3 glass px-4 py-2 rounded-2xl z-20 pointer-events-auto border-white/10">
           <div className="glow-point" />
           <span className="text-[10px] font-black uppercase tracking-widest text-primary">Mesh Network Active</span>
        </div>
      </div>

      {/* ── FOREGROUND UI OVERLAY ── */}
      <div className="ui-overlay">
        <div className="page-container">
          
          {/* ── HEADER ── */}
          <header className="flex items-end justify-between mb-10 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Node ID: {nodeId}</p>
              <h1 className="heading-xl text-gradient">
                Shared<span className="text-primary italic">Net</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 ${emergency ? 'text-danger' : 'text-secondary'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${emergency ? 'bg-danger shadow-[0_0_8px_#ef4444]' : 'bg-secondary shadow-[0_0_8px_#10b981]'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{emergency ? 'Alert' : 'Stable'}</span>
              </div>
            </div>
          </header>

          <div className="bento-grid">
            {/* SOS CARD (Feature) */}
            <div className="bento-col-8">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSOS}
                className="bento-card w-full group relative min-h-[220px] justify-end border-danger/20 hover:border-danger/40"
                style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(15,23,42,0.6) 100%)' }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-danger to-transparent opacity-30" />
                <div className="absolute top-6 right-6 p-4 bg-danger/10 rounded-2xl text-danger group-hover:scale-110 transition-transform">
                  <ShieldAlert size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="heading-lg text-white">EMERGENCY SOS</h2>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Instant Mesh Broadcast • Peer-to-Peer Relay</p>
                </div>
                <div className="scan-line !bg-danger/20" />
              </motion.button>
            </div>

            {/* STATS CARD */}
            <div className="bento-col-4">
              <div className="bento-card h-full justify-between border-white/5">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Network Intel</p>
                    <Activity size={16} className="text-primary" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-black text-white">{stats.messageCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Signals Received</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white">{stats.shardCount}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Fragments Cached</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex gap-2">
                   <div className="w-1 h-4 bg-primary rounded-full" />
                   <div className="w-1 h-4 bg-secondary rounded-full" />
                   <div className="w-1 h-4 bg-accent rounded-full" />
                </div>
              </div>
            </div>

            {/* ACTION CARDS */}
            <div className="bento-col-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/create?mode=intel')}
                className="bento-card w-full h-full min-h-[140px] border-primary/20 hover:border-primary/40 text-left"
              >
                <div className="mb-4 text-primary bg-primary/10 w-fit p-3 rounded-2xl">
                  <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">INTEL DROP</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Share critical data</p>
              </motion.button>
            </div>

            <div className="bento-col-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/create?mode=safe')}
                className="bento-card w-full h-full min-h-[140px] border-secondary/20 hover:border-secondary/40 text-left"
              >
                <div className="mb-4 text-secondary bg-secondary/10 w-fit p-3 rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">SAFE CHECK</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Update your status</p>
              </motion.button>
            </div>

            {/* SURVIVAL KIT LINK */}
            <div className="bento-col-12">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/survival')}
                className="bento-card flex-row items-center justify-between p-6 bg-accent/5 border-accent/20 hover:border-accent/40"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-accent/20 rounded-2xl text-accent">
                    <Heart size={24} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-white italic">SURVIVAL KIT</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">First Aid • Signal Tools • Guidelines</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full glass border-white/10 flex items-center justify-center text-accent">
                   <Zap size={20} />
                </div>
              </motion.button>
            </div>

            {/* MORE TOOLS TOGGLE */}
            <div className="bento-col-12">
               <button
                 onClick={() => setShowMore(!showMore)}
                 className="w-full py-4 glass border-white/5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors"
               >
                 {showMore ? 'Collapse Tactical Tools' : 'Explore Tactical Tools'}
               </button>
            </div>
          </div>

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 bento-grid"
              >
                <div className="bento-col-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/scan')}
                    className="bento-card w-full border-white/5 text-left h-full"
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
                    className="bento-card w-full border-white/5 text-left h-full"
                  >
                    <div className="p-3 bg-white/5 w-fit rounded-xl mb-4 text-slate-400">
                      <Inbox size={20} />
                    </div>
                    <h4 className="font-bold text-white">INTEL HUB</h4>
                    <p className="text-[10px] font-medium text-slate-500 uppercase">Inbox & Records</p>
                  </motion.button>
                </div>

                <div className="bento-col-4">
                  <div className="bento-card border-white/5 h-full">
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
                      className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vaultOpen ? 'bg-secondary text-white' : 'glass border-white/10 text-slate-400'}`}
                    >
                      {vaultOpen ? 'SECURE VAULT' : 'ACCESS VAULT'}
                    </button>
                  </div>
                </div>

                <div className="bento-col-12">
                   <div className="bento-card flex-row items-center justify-between border-white/5 py-4">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">System</p>
                          <p className="text-[11px] font-bold text-slate-300 uppercase">v2.7.6-S</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase">Sync Status</p>
                          <p className="text-[11px] font-bold text-secondary uppercase">Encrypted</p>
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
        </div>
      </div>

      <EmergencyCard isOpen={showEmergencyCard} onClose={() => setShowEmergencyCard(false)} />

      {!showMore && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSOS}
          className="fixed bottom-28 right-6 z-[100] w-16 h-16 rounded-full bg-danger text-white shadow-2xl shadow-danger/40 flex items-center justify-center border-4 border-white/10"
        >
          <ShieldAlert size={28} />
        </motion.button>
      )}

      <AnimatePresence>
        {isBroadcasting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center border-4 border-white/10">
                <Bluetooth size={56} color="white" className="animate-pulse" />
              </div>
            </div>
            
            <h2 className="heading-lg text-white mb-4 italic">BROADCASTING SOS</h2>
            <p className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] max-w-xs">
              Initiating Bluetooth Mesh Beacon... <br />
              Relaying Critical Signal to Peer Nodes.
            </p>

            <div className="mt-16 flex gap-3">
              {[0, 0.2, 0.4].map(delay => (
                <div key={delay} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
on.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;
