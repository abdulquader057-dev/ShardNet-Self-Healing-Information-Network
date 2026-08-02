import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Unlock, ShieldAlert, CheckCircle2, Trash2, Shield, Activity, Info, AlertTriangle, Map, RefreshCw, Globe, Zap, ThumbsUp, ThumbsDown, Clock, Layers, Bluetooth } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getAllShards, saveMessage, getAllMessages, db, addLog, getMessageLifecycle, LIFECYCLE, getSetting, updateMessageUsefulness, USEFULNESS } from '../storage/db';
import { reconstructMessage } from '../core/sharding';
import { getConsensusStatus } from '../core/consensusEngine';
import { getCategoryStyle, getTrustLevel } from '../utils/qr';
import { beamSignal, isSharingSupported } from '../utils/sharing';
import { safeInterval } from '../core/stability';

const ReconstructedView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedMessages, setSavedMessages] = useState([]);
  const [incompleteMessages, setIncompleteMessages] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('filter') || 'All');
  const [appMode, setAppMode] = useState('Relay');
  const [groupedMessages, setGroupedMessages] = useState({});

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter) setFilter(urlFilter);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
    getSetting('app_mode', 'Relay').then(setAppMode);
    const interval = safeInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    const allShards = await getAllShards();
    const saved = await getAllMessages();
    
    // 3. Redundancy Control: Detect and group similar messages
    const processed = detectSimilarMessages(saved);
    setSavedMessages(processed);
    
    // 6. Grouping by Location/Category
    const groups = processed.reduce((acc, msg) => {
      const key = `${msg.location || 'Unknown'} - ${msg.category}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      return acc;
    }, {});
    setGroupedMessages(groups);

    // Incomplete signals logic
    const shardGroups = allShards.reduce((acc, shard) => {
      if (!acc[shard.messageId]) acc[shard.messageId] = [];
      acc[shard.messageId].push(shard);
      return acc;
    }, {});

    const incomplete = [];
    for (const msgId in shardGroups) {
      const result = await reconstructMessage(shardGroups[msgId]);
      if (!result) continue; // Skip if reconstruction failed or is truly empty

      const isSaved = saved.find(s => s.messageId === msgId);
      
      if (!isSaved) {
        // If reconstructMessage returns a string (success)
        if (typeof result === 'string') {
          await handleSave({ messageId: msgId, message: result, ...shardGroups[msgId][0] });
        } else {
          // If it was supposed to return progress (future-proofing or if we update sharding.js)
          incomplete.push({
            messageId: msgId,
            count: result.count || shardGroups[msgId].length,
            total: result.total || shardGroups[msgId][0].totalShards,
            category: shardGroups[msgId][0].category || 'Info',
            progress: ((result.count || shardGroups[msgId].length) / (result.total || shardGroups[msgId][0].totalShards)) * 100,
            lifecycle: await getMessageLifecycle(msgId)
          });
        }
      }
    }
    setIncompleteMessages(incomplete);
  };

  const detectSimilarMessages = (msgs) => {
    // Simple heuristic: same category and location + similar length
    const result = [];
    if (!msgs || msgs.length === 0) return result;

    const used = new Set();

    for (let i = 0; i < msgs.length; i++) {
      if (!msgs[i] || used.has(msgs[i].messageId)) continue;
      
      const group = [msgs[i]];
      used.add(msgs[i].messageId);

      for (let j = i + 1; j < msgs.length; j++) {
        if (!msgs[j] || used.has(msgs[j].messageId)) continue;
        
        // Match criteria
        const isSimilar = msgs[i].category === msgs[j].category && 
                          msgs[i].location === msgs[j].location &&
                          msgs[i].message && msgs[j].message &&
                          Math.abs(msgs[i].message.length - msgs[j].message.length) < 10;
        
        if (isSimilar) {
          group.push(msgs[j]);
          used.add(msgs[j].messageId);
        }
      }

      if (group.length > 1) {
        result.push({ ...group[0], similarCount: group.length - 1, relatedIds: group.slice(1).map(g => g.messageId) });
      } else {
        result.push(group[0]);
      }
    }
    return result;
  };

  const handleSave = async (msg) => {
    await saveMessage({
      ...msg,
      reconstructedAt: Date.now(),
      usefulness: USEFULNESS.RELEVANT,
      lastInteraction: Date.now()
    });
    // Removed recursive fetchData() call to prevent infinite loop
  };

  const handleUsefulness = async (id, status) => {
    await updateMessageUsefulness(id, status);
    await addLog(`Feedback recorded: Intelligence marked as ${status}.`, 'info');
    fetchData();
  };

  const deleteMessage = async (id) => {
    await db.messages.delete(id);
    fetchData();
  };

  const handleBeam = async (msg) => {
    try {
      await beamSignal(msg, `INTEL: ${msg.category}`);
      await addLog('Intelligence beamed to nearby nodes.', 'success');
    } catch (err) {
       if (err.name !== 'AbortError') addLog('Beam failed.', 'danger');
    }
  };

  // 4. Message Priority System
  const getPriorityScore = (msg) => {
    const base = { 'Emergency': 100, 'Medical': 80, 'Safe Route': 60, 'Info': 20 }[msg.category] || 0;
    const usefulnessMod = msg.usefulness === USEFULNESS.OUTDATED ? -50 : msg.usefulness === USEFULNESS.NOT_USEFUL ? -80 : 0;
    return base + usefulnessMod;
  };

  const sortedGroups = Object.keys(groupedMessages).sort((a, b) => {
    const scoreA = getPriorityScore(groupedMessages[a][0]);
    const scoreB = getPriorityScore(groupedMessages[b][0]);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-2xl">
            <Layers className="text-secondary" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Intel Hub</h2>
            <p className="text-[14px] font-black text-slate-500 uppercase tracking-widest">Consolidated Mesh Intelligence</p>
          </div>
        </div>
        <div className="flex gap-3">
          {['All', 'Emergency', 'Safe Route'].map(f => (
            <button 
              key={f} onClick={() => setSearchParams({ filter: f })}
              className={`px-4 py-2 rounded-xl text-[14px] font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-12">
          {sortedGroups.map(groupKey => {
            const messages = groupedMessages[groupKey].filter(m => filter === 'All' || m.category === filter);
            if (messages.length === 0) return null;

            return (
              <section key={groupKey} className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <Map size={14} className="text-slate-500" />
                  <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em]">{groupKey}</h3>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <AnimatePresence>
                    {messages.map((msg) => {
                      const trust = getTrustLevel(msg.trustScore, msg.relayCount, msg.deviceCount);
                      const isOutdated = msg.usefulness !== USEFULNESS.RELEVANT;

                      return (
                        <motion.div 
                          layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          key={msg.messageId}
                          className={`glass p-8 rounded-[2.5rem] border-white/10 relative group overflow-hidden transition-all ${isOutdated ? 'opacity-50 grayscale' : ''} ${msg.category === 'Emergency' ? 'ring-1 ring-danger/30' : ''}`}
                        >
                          {/* 3. Redundancy Indicator */}
                          {msg.similarCount > 0 && (
                            <div className="absolute top-0 left-0 bg-accent px-4 py-1 text-[14px] font-black uppercase tracking-widest text-white rounded-br-2xl">
                              {msg.similarCount} similar signals merged
                            </div>
                          )}

                          <div className="absolute top-0 right-0 p-4 flex gap-2">
                            {(() => {
                              const status = getConsensusStatus(msg);
                              const iconStyle = status === 'verified' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                               status === 'confirmed' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 
                                               'text-slate-500 bg-white/5 border-white/10';
                              return (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[14px] font-black uppercase tracking-widest ${iconStyle}`}>
                                  {status === 'verified' ? <CheckCircle2 size={10} /> : status === 'confirmed' ? <Activity size={10} /> : <Info size={10} />}
                                  {status}
                                </div>
                              );
                            })()}
                            <div className={`px-3 py-1 rounded-full border text-[14px] font-black uppercase tracking-widest ${getCategoryStyle(msg.category)}`}>
                              {msg.category}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-6">
                            <span className="text-[14px] font-mono text-slate-500 uppercase tracking-widest font-black">
                              {new Date(msg.reconstructedAt).toLocaleTimeString()}
                            </span>
                            <span className="text-slate-800">|</span>
                            <div className="flex items-center gap-2">
                              <Globe size={12} className="text-secondary" />
                              <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Reached {msg.deviceCount || 1} devices</span>
                            </div>
                          </div>

                          <p className="text-xl leading-relaxed text-slate-100 font-medium whitespace-pre-wrap italic mb-8">
                            "{msg.message}"
                          </p>

                          {/* 1. Usefulness Actions */}
                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUsefulness(msg.messageId, USEFULNESS.RELEVANT)}
                                className={`p-2 rounded-xl transition-all ${msg.usefulness === USEFULNESS.RELEVANT ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-white/5 text-slate-600 border border-transparent'}`}
                                title="Still Relevant"
                              >
                                <ThumbsUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleUsefulness(msg.messageId, USEFULNESS.OUTDATED)}
                                className={`p-2 rounded-xl transition-all ${msg.usefulness === USEFULNESS.OUTDATED ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-white/5 text-slate-600 border border-transparent'}`}
                                title="Mark Outdated"
                              >
                                <Clock size={16} />
                              </button>
                              <button 
                                onClick={() => handleUsefulness(msg.messageId, USEFULNESS.NOT_USEFUL)}
                                className={`p-2 rounded-xl transition-all ${msg.usefulness === USEFULNESS.NOT_USEFUL ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-white/5 text-slate-600 border border-transparent'}`}
                                title="Not Useful"
                              >
                                <ThumbsDown size={16} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className={`px-3 py-1 rounded-lg bg-white/5 text-[14px] font-black uppercase tracking-widest ${trust.color}`}>
                               Trust: {trust.label}
                              </div>
                              <div className="flex gap-2">
                                {isSharingSupported() && (
                                  <button onClick={() => handleBeam(msg)} className="p-2 text-secondary hover:bg-secondary/10 rounded-xl transition-all" title="Beam to Nearby"><Bluetooth size={16} /></button>
                                )}
                                <button onClick={() => deleteMessage(msg.messageId)} className="p-2 text-slate-700 hover:text-danger"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </section>
            );
          })}
        </div>

        <div className="space-y-12">
          {/* Signals in Transit */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
              <Zap size={18} className="text-primary" />
              Incoming Mesh
            </h3>
            <div className="space-y-3">
              {incompleteMessages.length === 0 && (
                <p className="text-center py-8 text-[14px] font-black text-slate-700 uppercase tracking-widest">No active fragments.</p>
              )}
              {incompleteMessages.map((msg) => (
                <div key={msg.messageId} className="glass p-4 rounded-2xl border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-[14px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">{msg.category}</span>
                    <span className="text-primary">{msg.count}/{msg.total}</span>
                  </div>
                  <div className="bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${msg.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReconstructedView;
