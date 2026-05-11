import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Trash2, Clock, Info, CheckCircle2, XCircle, Share2, Shield, QrCode, Download, Copy, Maximize2, Layers, Repeat, Map, Globe, Bluetooth } from 'lucide-react';
import { getAllShards, db, addLog, getNodeIdentity, getMessageLifecycle } from '../storage/db';
import { reconstructMessage } from '../core/sharding';
import { generateShardQR, getTrustLevel, getCategoryStyle, generateBundleQR } from '../utils/qr';
import { beamSignal, isSharingSupported } from '../utils/sharing';
import { safeCall, safeCallAsync, safeInterval } from '../core/stability';

const ShardGroup = ({ messageId, messageShards, nodeId, onRebroadcast, onShareBundle, onBeamBundle, onDeleteShard, now }) => {
  const [lifecycle, setLifecycle] = useState('Detecting...');
  const firstShard = messageShards[0];
  const isComplete = messageShards.length >= firstShard.totalShards;
  const progress = (messageShards.length / firstShard.totalShards) * 100;

  useEffect(() => {
    safeCallAsync(() => getMessageLifecycle(messageId).then(setLifecycle), "Get Message Lifecycle");
  }, [messageShards.length, messageId]);

  const formatTime = (ms) => {
    const diff = ms - now;
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const getLifecycleColor = (status) => {
    switch (status) {
      case 'Propagating': return 'bg-secondary/20 text-secondary';
      case 'Fully Reconstructed': return 'bg-emerald-500/20 text-emerald-500';
      case 'Ready for Reconstruction': return 'bg-accent/20 text-accent';
      case 'Expired': return 'bg-danger/20 text-danger';
      default: return 'bg-white/5 text-slate-500';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bento-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-white/10">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getCategoryStyle(firstShard.category)}`}>
              {firstShard.category || 'Info'}
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getLifecycleColor(lifecycle)}`}>
              {lifecycle}
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-black uppercase tracking-widest">SIGNAL: {messageId.substring(0, 12)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${isComplete ? 'bg-secondary' : 'bg-primary'} animate-pulse shadow-[0_0_8px_currentColor]`} />
            <h3 className="text-xl font-black italic uppercase text-white">
              {isComplete ? 'SIGNAL RECONSTRUCTED' : `INTEL RECOVERY (${messageShards.length}/${firstShard.totalShards})`}
            </h3>
          </div>
        </div>
        
        <div className="flex flex-col md:items-end gap-4">
          <div className="w-full md:w-48 bg-white/5 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full ${isComplete ? 'bg-secondary' : 'bg-primary'}`}
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => onShareBundle(messageId)}
              className="btn-premium btn-primary !py-2.5 !px-6 !text-[9px]"
            >
              <Layers size={14} /> PROPAGATION BUNDLE
            </button>
            {isSharingSupported() && (
              <button 
                onClick={() => onBeamBundle(messageId)}
                className="btn-premium btn-outline !py-2.5 !px-6 !text-[9px]"
              >
                <Bluetooth size={14} /> MESH BEAM
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {messageShards.map((shard) => {
          const trust = getTrustLevel(shard.trustScore, shard.relayCount, shard.deviceCount);
          const isExpired = shard.expiry < now;
          const isRelayed = shard.originNodeId !== nodeId;
          
          return (
            <motion.div 
              layout
              key={shard.id}
              className={`bento-card p-6 border-white/5 space-y-6 group relative ${isExpired ? 'opacity-40 grayscale' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fragment #{shard.shardIndex + 1}</p>
                  <div className="flex items-center gap-2">
                    <Map size={10} className="text-slate-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{shard.location || 'Unknown Sector'}</span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-lg glass border-white/10 text-[8px] font-black uppercase tracking-widest ${trust.color}`}>
                  Trust: {trust.label}
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-y border-white/5">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase">Relays</p>
                   <p className="text-xs font-bold text-white">{shard.relayCount || 0}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-500 uppercase">Density</p>
                   <p className="text-xs font-bold text-white">{shard.deviceCount || 1} Nodes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-danger' : 'text-slate-400'}`}>
                  <Clock size={12} /> {isExpired ? 'SIGNAL EXPIRED' : `TTL: ${formatTime(shard.expiry)}`}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onRebroadcast(shard)}
                    className="flex-1 btn-premium btn-outline !py-2.5 !text-[9px]"
                  >
                    <Share2 size={12} /> BROADCAST
                  </button>
                  <button 
                    onClick={() => onDeleteShard(shard.id)}
                    className="p-2.5 glass border-white/10 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              {isRelayed && (
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Repeat size={40} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const StorageView = () => {
  const [shards, setShards] = useState([]);
  const [groupedShards, setGroupedShards] = useState({});
  const [rebroadcastQR, setRebroadcastQR] = useState(null);
  const [selectedShard, setSelectedShard] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [bundleQR, setBundleQR] = useState(null);
  const [nodeId, setNodeId] = useState('unknown');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchShards();
    getNodeIdentity().then(setNodeId);
    const fetchInterval = safeInterval(fetchShards, 3000);
    const clockInterval = safeInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(fetchInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const fetchShards = async () => {
    const allShards = await getAllShards();
    setShards(allShards);
    
    const groups = allShards.reduce((acc, shard) => {
      if (!acc[shard.messageId]) acc[shard.messageId] = [];
      acc[shard.messageId].push(shard);
      return acc;
    }, {});
    setGroupedShards(groups);
  };

  const handleRebroadcast = async (shard) => {
    const qr = await generateShardQR(shard);
    setRebroadcastQR(qr);
    setSelectedShard(shard);
    await addLog(`Rebroadcasting shard ${shard.shardIndex + 1} to nearby mesh nodes.`, 'info');
  };

  const handleShareBundle = async (messageId) => {
    const messageShards = groupedShards[messageId];
    const qr = await generateBundleQR(messageShards);
    setBundleQR(qr);
    await addLog(`Initializing bundle propagation for message ${messageId.substring(0, 8)}.`, 'info');
  };

  const handleBeamBundle = async (messageId) => {
    const messageShards = groupedShards[messageId];
    try {
      await beamSignal(messageShards, `Emergency Fragments [${messageId.substring(0, 6)}]`);
      await addLog(`Mesh beam initialized for message ${messageId.substring(0, 8)}.`, 'success');
    } catch (err) {
      if (err.name !== 'AbortError') {
        await addLog('Beam failed: Device proximity hardware not responding.', 'danger');
      }
    }
  };

  const deleteShard = async (id) => {
    await db.shards.delete(id);
    fetchShards();
  };

  return (
    <div className="page-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="bg-secondary/20 p-3 rounded-2xl shadow-lg shadow-secondary/5 text-secondary border border-secondary/20">
            <Database size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="heading-lg text-white italic uppercase tracking-tighter">Mesh Vault</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Physical Fragment Storage</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 glass border-white/10 rounded-full">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Storage Core Active</span>
        </div>
      </div>

      <div className="bento-grid mb-12">
        <div className="bento-col-12">
           <div className="bento-card flex-row items-center gap-6 border-primary/20 bg-primary/[0.02]">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary">Persistence Protocol</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  This device securely caches encrypted intelligence fragments. <span className="text-white font-black italic uppercase">Signals are incomplete</span> until enough fragments converge. Propagation occurs via opportunistic proximity encounters.
                </p>
              </div>
           </div>
        </div>
      </div>

      {Object.keys(groupedShards).length === 0 ? (
        <div className="bento-card p-20 border-dashed border-white/5 text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
            <Database size={40} className="text-slate-500" />
          </div>
          <div className="space-y-2">
            <p className="text-slate-500 font-black italic uppercase tracking-[0.3em] text-xs">Storage Volume Empty</p>
            <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest">No mesh fragments detected in local cache</p>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedShards).map(([messageId, messageShards]) => (
            <ShardGroup 
              key={messageId}
              messageId={messageId}
              messageShards={messageShards}
              nodeId={nodeId}
              onRebroadcast={handleRebroadcast}
              onShareBundle={handleShareBundle}
              onBeamBundle={handleBeamBundle}
              onDeleteShard={deleteShard}
              now={now}
            />
          ))}
        </div>
      )}

      {/* Rebroadcast Modal */}
      <AnimatePresence>
        {(rebroadcastQR || bundleQR) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-premium p-8 rounded-[2.5rem] max-w-sm w-full space-y-6 border-white/10 relative"
            >
              <button 
                onClick={() => {
                  setRebroadcastQR(null);
                  setBundleQR(null);
                  setShowFullscreen(false);
                }}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white"
              >
                <XCircle size={24} />
              </button>

              <div className="text-center space-y-2">
                <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${bundleQR ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                  {bundleQR ? <Layers size={24} /> : <QrCode size={24} />}
                </div>
                <h3 className="text-xl font-black uppercase italic">{bundleQR ? 'Bundle Rebroadcast' : 'Shard Signal'}</h3>
                <p className="text-xs text-slate-500 font-medium">Point another node's camera at this screen.</p>
              </div>
              
              <div className="bg-white p-6 rounded-[2rem] mx-auto w-fit border-8 border-white/10 shadow-2xl shadow-primary/10">
                <img src={rebroadcastQR || bundleQR} alt="QR" className="w-48 h-48" />
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowFullscreen(true)}
                  className="btn-premium btn-outline w-full !py-4"
                >
                  <Maximize2 size={16} /> FULLSCREEN QR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFullscreen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white p-12 cursor-pointer"
          >
            <img src={rebroadcastQR || bundleQR} alt="QR" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorageView;
