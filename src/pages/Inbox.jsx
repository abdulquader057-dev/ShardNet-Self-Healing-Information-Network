import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox as InboxIcon, CheckCircle2, Clock, MapPin, AlertCircle, ChevronRight, Trash2 } from 'lucide-react';
import { getAllMessages, getAllShards, db } from '../storage/db';
import { useNavigate } from 'react-router-dom';
import { beamSignal, isSharingSupported } from '../utils/sharing';
import { safeCall, safeCallAsync, safeInterval } from '../core/stability';
import { getMessageTrust } from '../intelligence/trustEngine';
import { getTTLStatus, getMessageAge } from '../intelligence/ttlVisuals';
import { getConsensusStatus } from '../core/consensusEngine';
import { Volume2, Users } from 'lucide-react';
import { ReconstructionUI } from '../modules/ReconstructionUI';

const Inbox = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
    const interval = safeInterval(fetchInbox, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchInbox = async () => {
    try {
      const messages = await getAllMessages();
      const shards = await getAllShards();
      
      // Group shards by messageId to find partials
      const shardGroups = shards.reduce((acc, s) => {
        if (!acc[s.messageId]) acc[s.messageId] = [];
        acc[s.messageId].push(s);
        return acc;
      }, {});

      const inboxItems = [];

      // 1. Add Complete Messages
      messages.forEach(msg => {
        inboxItems.push({
          id: msg.messageId,
          type: 'complete',
          status: 'verified',
          text: msg.message,
          timestamp: msg.reconstructedAt,
          location: msg.location,
          geo: msg.geo,
          category: msg.category,
          progress: 100,
          expiry: msg.expiry || (msg.reconstructedAt + 86400000), // Default 24h
          contributingNodes: msg.contributingNodes || [],
          witnessNodes: msg.witnessNodes || [],
          consensusHash: msg.consensusHash
        });
      });

      // 2. Add Partial/Receiving Messages (that aren't complete yet)
      Object.entries(shardGroups).forEach(([msgId, group]) => {
        const isComplete = messages.some(m => m.messageId === msgId);
        if (!isComplete) {
          const first = group[0];
          const progress = (group.length / first.totalShards) * 100;
          inboxItems.push({
            id: msgId,
            type: 'partial',
            status: group.length === 1 ? 'receiving' : 'partial',
            text: `SIGNAL INTERCEPTED: Recovering ${group.length}/${first.totalShards} fragments...`,
            timestamp: Math.max(...group.map(s => s.createdAt)),
            location: first.location,
            category: first.category,
            progress: progress,
            totalShards: first.totalShards,
            shards: group
          });
        }
      });

      // Sort by newest first
      inboxItems.sort((a, b) => b.timestamp - a.timestamp);
      setItems(inboxItems);
    } catch (err) {
      console.error('Inbox fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (item) => {
    if (item.type === 'complete') {
      await db.messages.delete(item.id);
    } else {
      // Delete all shards for this partial
      const shardsToDelete = await db.shards.where('messageId').equals(item.id).toArray();
      for (const s of shardsToDelete) {
        await db.shards.delete(s.id);
      }
    }
    fetchInbox();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
        >
          <span style={{ fontSize: 20 }}>←</span>
        </button>
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Unified <span className="text-secondary">Inbox</span></h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mesh Intelligence Hub</p>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-600 animate-pulse font-black uppercase text-[10px] tracking-widest">Syncing Vault...</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center glass rounded-[2.5rem] border-white/5 border-dashed">
            <InboxIcon size={48} className="mx-auto text-slate-800 mb-4" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-widest">No active signals in range.</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`relative overflow-hidden glass p-6 rounded-[2rem] border-l-8 transition-all ${
                  item.status === 'verified' ? 'border-secondary' : 'border-primary'
                } bg-white/[0.02]`}
              >
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} />
                      <ConsensusBadge item={item} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {getMessageAge(item.timestamp)}
                      </span>
                    </div>
                    <h3 className={`text-lg font-black italic uppercase tracking-tight leading-tight ${item.status === 'verified' ? 'text-slate-100' : 'text-slate-400 italic opacity-60'}`}>
                      {item.text.startsWith('AUDIO:') ? 'Voice Intelligence Captured' : item.text}
                    </h3>
                  </div>

                  {item.text.startsWith('AUDIO:') && item.status === 'verified' && (
                    <div className="mt-4 p-4 glass rounded-2xl border-white/5 flex items-center gap-4">
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const audio = new Audio(item.text.replace('AUDIO:', ''));
                          safeCall(() => audio.play(), "Inbox Audio Play");
                        }}
                        className="p-3 bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-all"
                       >
                        <Volume2 size={20} />
                       </button>
                       <div className="flex-1 space-y-1">
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 3 }}
                            className="h-full bg-primary"
                           />
                         </div>
                         <p className="text-[8px] font-black uppercase text-slate-500">Audio Payload: Encrypted</p>
                       </div>
                    </div>
                  )}
                  <button 
                    onClick={() => deleteItem(item)}
                    className="p-2 text-slate-700 hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {item.status !== 'verified' && item.totalShards > 1 && (
                  <ReconstructionUI totalShards={item.totalShards} receivedShards={item.shards} />
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-primary" />
                    {item.geo ? (
                      <a 
                        href={getGoogleMapsUrl(item.geo)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {item.location} <span style={{ marginLeft: 4 }}>→</span>
                      </a>
                    ) : (
                      item.location
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {item.status === 'verified' ? 'Recovered' : 'Syncing'}
                  </div>
                </div>

                {/* TTL Decay Bar for verified messages */}
                {item.status === 'verified' && (
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                      <span>Message Integrity</span>
                      <span>TTL</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getTTLStatus(item.timestamp, item.expiry).percentage}%` }}
                        className={`h-full ${getTTLStatus(item.timestamp, item.expiry).color}`}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

const ConsensusBadge = ({ item }) => {
  if (item.status !== 'verified') return null;
  const status = getConsensusStatus(item);
  const config = {
    verified: { label: '✔ VERIFIED', color: 'bg-emerald-500 text-white' },
    confirmed: { label: '✔ CONFIRMED', color: 'bg-blue-500 text-white' },
    pending: { label: '⏳ PENDING', color: 'bg-slate-700 text-slate-300' },
    unverified: { label: '⚠ UNVERIFIED', color: 'bg-amber-600 text-white' }
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.1em] ${config.color}`}>
      <Users size={8} />
      {config.label}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const config = {
    verified: { icon: <CheckCircle2 size={12} />, label: 'Verified', color: 'bg-secondary/20 text-secondary border-secondary/20' },
    partial: { icon: <Clock size={12} />, label: 'Partial', color: 'bg-primary/20 text-primary border-primary/20' },
    receiving: { icon: <AlertCircle size={12} />, label: 'Receiving', color: 'bg-amber-500/20 text-amber-500 border-amber-500/20' }
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${config.color}`}>
      {config.icon}
      {config.label}
    </div>
  );
};

export default Inbox;
