import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Clock, Globe, ShieldAlert, AlertTriangle, Info, Timer, Repeat } from 'lucide-react';
import { useMesh } from '../core/MeshProvider';
import { db } from '../storage/db';
import VoiceRecorder from '../components/VoiceRecorder';

const CATEGORIES = [
  { id: 'INFO', label: 'Info', icon: Info, color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10' },
  { id: 'WARNING', label: 'Warning', icon: AlertTriangle, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
  { id: 'EMERGENCY', label: 'Emergency', icon: ShieldAlert, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
];

const TTLS = [
  { id: 3600000, label: '1h' },
  { id: 10800000, label: '3h' },
  { id: 21600000, label: '6h' },
];

const MAX_CHARS = 240;

export default function Forum() {
  const { broadcast, nodeId, isReady } = useMesh();
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [alias, setAlias] = useState(localStorage.getItem('setting_device_name') || 'Anonymous');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('INFO');
  const [selectedTTL, setSelectedTTL] = useState(10800000); // 3h
  
  const scrollRef = useRef(null);

  const loadPosts = async () => {
    try {
      const allPosts = await db.forum.orderBy('timestamp').toArray();
      // Filter out expired TTLs if they exist
      const now = Date.now();
      const validPosts = allPosts.filter(p => !p.ttl || (p.timestamp + p.ttl > now));
      setPosts(validPosts);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    } catch (e) {
      console.warn('Failed to load forum posts', e);
    }
  };

  useEffect(() => {
    loadPosts();
    const handleNewPost = () => loadPosts();
    window.addEventListener('forum-updated', handleNewPost);
    return () => window.removeEventListener('forum-updated', handleNewPost);
  }, []);

  const handleVoiceSend = async (base64Audio) => {
    if (!isReady) return;
    const post = {
      id: `forum-${Date.now()}-${Math.random().toString(36).substring(2,6)}`,
      content: base64Audio,
      authorNodeId: nodeId,
      authorAlias: alias,
      category: selectedCategory,
      ttl: selectedTTL,
      timestamp: Date.now()
    };
    try {
      await db.forum.put(post);
      await broadcast(JSON.stringify(post), 'forum', selectedTTL, selectedCategory);
      loadPosts();
    } catch(err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !isReady || inputText.length > MAX_CHARS) return;

    const postContent = inputText.trim();
    setInputText('');

    const post = {
      id: crypto.randomUUID ? crypto.randomUUID() : `forum-${Date.now()}`,
      timestamp: Date.now(),
      authorNodeId: nodeId,
      authorAlias: alias,
      content: postContent,
      category: selectedCategory,
      ttl: selectedTTL
    };

    // Save locally
    await db.forum.put(post);
    loadPosts();

    // Broadcast to mesh
    const payloadStr = JSON.stringify(post);
    broadcast(payloadStr, 'forum', selectedTTL, selectedCategory).catch(err => {
      console.warn('Forum broadcast failed', err);
    });
  };

  const handleRebroadcast = async (post) => {
    if (!isReady) return;
    try {
      // Re-broadcast with original values but fresh TTL window from now
      await broadcast(JSON.stringify(post), 'forum', post.ttl || 10800000, post.category || 'INFO');
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Signal Re-broadcasted' } }));
    } catch(err) {
      console.error(err);
    }
  };

  const getRelativeTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    return `${Math.floor(diff/3600)}h ago`;
  };

  const filteredPosts = activeFilter === 'ALL' 
    ? posts 
    : posts.filter(p => (p.category || 'INFO') === activeFilter);

  return (
    <div className="flex flex-col h-full pb-48">
      {/* Header */}
      <div className="px-6 pt-6 pb-2 space-y-4 shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
              <Hash className="text-[#3B82F6]" size={28} />
              Mesh Forum
            </h1>
            <p className="text-[#8B8B9A] text-sm">Decentralized Emergency Comms</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-3 py-1.5 rounded-full border border-[#22C55E]/20">
            <Globe size={12} /> {isReady ? 'Live' : 'Syncing'}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              activeFilter === 'ALL' ? 'bg-white text-black' : 'bg-[#141419] text-[#8B8B9A] border border-[#2A2A35]'
            }`}
          >
            All Signals
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeFilter === cat.id ? `${cat.bg} ${cat.color} border border-current` : 'bg-[#141419] text-[#8B8B9A] border border-[#2A2A35]'
              }`}
            >
              <cat.icon size={14} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#5A5A6A] space-y-3">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="text-xs uppercase tracking-widest font-bold">No broadcasts found</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isMine = post.authorNodeId === nodeId;
            const catInfo = CATEGORIES.find(c => c.id === (post.category || 'INFO')) || CATEGORIES[0];
            const ttlHours = post.ttl ? (post.ttl / 3600000) : 3;

            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A6A] ml-1 mb-1">
                    {post.authorAlias} <span className="font-mono">({post.authorNodeId.slice(0,6)})</span>
                  </span>
                )}
                
                <div className={`
                  max-w-[85%] rounded-2xl relative overflow-hidden
                  ${isMine 
                    ? 'bg-[#3B82F6] text-white rounded-tr-sm shadow-[0_4px_20px_rgba(59,130,246,0.15)]' 
                    : 'bg-[#141419] border border-[#2A2A35] text-white rounded-tl-sm'
                  }
                `}>
                  {/* Badge Row */}
                  <div className={`px-4 py-2 flex items-center justify-between gap-4 border-b ${isMine ? 'border-white/20 bg-black/10' : 'border-[#2A2A35] bg-black/20'}`}>
                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${!isMine ? catInfo.color : 'text-white'}`}>
                      <catInfo.icon size={12} />
                      {catInfo.label}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                      <Timer size={10} /> TTL: {ttlHours}H
                    </div>
                  </div>

                  <div className="p-4">
                    {post.content.startsWith('data:audio/') ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-70">Voice Intel</span>
                        <audio controls src={post.content} className="max-w-[200px] h-8 rounded" />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-1 mx-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A6A] flex items-center gap-1">
                    <Clock size={10} /> {getRelativeTime(post.timestamp)}
                  </span>
                  {!isMine && (
                    <button onClick={() => handleRebroadcast(post)} className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] flex items-center gap-1 hover:text-white transition-colors">
                      <Repeat size={10} /> Relay
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-[#2A2A35] shrink-0">
        
        {/* Controls Row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-2 rounded-xl transition-colors ${
                  selectedCategory === cat.id ? `${cat.bg} ${cat.color}` : 'text-[#5A5A6A] hover:bg-[#141419]'
                }`}
                title={cat.label}
              >
                <cat.icon size={16} />
              </button>
            ))}
            <div className="w-px h-6 bg-[#2A2A35] self-center mx-1" />
            {TTLS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTTL(t.id)}
                className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center ${
                  selectedTTL === t.id ? 'bg-white text-black' : 'text-[#5A5A6A] hover:bg-[#141419]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className={`text-[10px] font-mono font-bold ${inputText.length > MAX_CHARS ? 'text-[#EF4444]' : 'text-[#5A5A6A]'}`}>
            {inputText.length}/{MAX_CHARS}
          </span>
        </div>

        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Broadcast to the mesh..."
            className="flex-1 bg-[#141419] border border-[#2A2A35] text-white rounded-2xl px-4 py-3 text-sm resize-none h-[52px] focus:outline-none focus:border-[#3B82F6] transition-colors"
            maxLength={MAX_CHARS}
          />
          <VoiceRecorder onRecordingComplete={handleVoiceSend} />
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || !isReady || inputText.length > MAX_CHARS}
            className="w-[52px] h-[52px] shrink-0 bg-[#3B82F6] text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:bg-[#141419] disabled:text-[#5A5A6A] transition-colors shadow-[0_4px_15px_rgba(59,130,246,0.2)] disabled:shadow-none"
          >
            <Send size={20} className={inputText.trim() ? "ml-1" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
