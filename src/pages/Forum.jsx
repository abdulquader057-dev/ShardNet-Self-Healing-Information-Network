import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Clock, Globe } from 'lucide-react';
import { useMesh } from '../core/MeshProvider';
import { db } from '../storage/db';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Forum() {
  const { broadcast, nodeId, isReady } = useMesh();
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [alias, setAlias] = useState(localStorage.getItem('setting_device_name') || 'Anonymous');
  const scrollRef = useRef(null);

  const loadPosts = async () => {
    try {
      const allPosts = await db.forum.orderBy('timestamp').toArray();
      setPosts(allPosts);
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
      timestamp: Date.now()
    };
    try {
      await db.forum.put(post);
      await broadcast(JSON.stringify(post), 'forum', 15);
      setPosts(prev => [...prev, post].sort((a,b) => a.timestamp - b.timestamp));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !isReady) return;

    const postContent = inputText.trim();
    setInputText('');

    const post = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      authorNodeId: nodeId,
      authorAlias: alias,
      content: postContent
    };

    // Save locally
    await db.forum.put(post);
    loadPosts();

    // Broadcast to mesh
    const payloadStr = JSON.stringify(post);
    broadcast(payloadStr, 'forum', 10).catch(err => {
      console.warn('Forum broadcast failed', err);
    });
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full pb-48">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-1 shrink-0">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-h1 text-white flex items-center gap-3">
              <Hash className="text-[#0A84FF]" size={28} />
              Global Forum
            </h1>
            <p className="text-body-sm text-slate-400">Takedown-immune public broadcast channel</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#34C759] bg-[#34C759]/10 px-3 py-1.5 rounded-full">
            <Globe size={12} /> Live Mesh
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 space-y-4 pb-4"
      >
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 opacity-50">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="text-xs uppercase tracking-widest font-black">No broadcasts yet</p>
          </div>
        ) : (
          posts.map(post => {
            const isMine = post.authorNodeId === nodeId;
            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-1">
                    {post.authorAlias} <span className="font-mono text-slate-600">({post.authorNodeId.slice(0,6)})</span>
                  </span>
                )}
                
                <div className={`
                  max-w-[85%] px-4 py-3 rounded-2xl relative overflow-hidden shadow-sm
                  ${isMine 
                    ? 'bg-[#0A84FF] text-white rounded-tr-sm' 
                    : 'bg-[#2C2C2E] border border-slate-700 text-slate-100 rounded-tl-sm'
                  }
                `}>
                  {post.content.startsWith('data:audio/') ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] uppercase font-black tracking-widest opacity-70">Voice Intel</span>
                      <audio controls src={post.content} className="max-w-[200px] h-8" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  )}
                </div>
                
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-1 mx-1 flex items-center gap-1">
                  <Clock size={10} /> {formatTime(post.timestamp)}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0A0A0F]/80 backdrop-blur-md border-t border-slate-800 shrink-0">
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
            className="flex-1 bg-[#1C1C1E] border border-slate-700 text-white rounded-xl px-4 py-3 text-sm resize-none h-[50px] focus:outline-none focus:border-[#0A84FF]"
            maxLength={500}
          />
          <VoiceRecorder onRecordingComplete={handleVoiceSend} />
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || !isReady}
            className="w-[50px] h-[50px] shrink-0 bg-[#0A84FF] text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:bg-[#1C1C1E] disabled:text-slate-500 transition-colors"
          >
            <Send size={20} className={inputText.trim() ? "ml-1" : ""} />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Messages flood to all reachable nodes permanently
          </p>
          <span className={`text-[10px] font-mono font-bold ${inputText.length > 450 ? 'text-[#FF3B30]' : 'text-slate-500'}`}>
            {inputText.length}/500
          </span>
        </div>
      </div>
    </div>
  );
}
