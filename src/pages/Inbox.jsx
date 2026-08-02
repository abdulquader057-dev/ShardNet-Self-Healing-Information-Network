import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, MessageSquare, ArrowLeft, Send, Clock, MapPin, User, Info, Loader2 } from 'lucide-react';
import { db } from '../storage/db';
import { useMesh } from '../core/MeshProvider';
import { safeCallAsync } from '../core/stability';
import PullToRefresh from '../components/PullToRefresh';

export default function Inbox() {
  const { sendDirect, nodeId, isReady } = useMesh();
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Load Contacts
  const loadContacts = async () => {
    try {
      const allContacts = await db.contacts.toArray();
      setContacts(allContacts.sort((a, b) => b.lastSeen - a.lastSeen));
    } catch (e) {
      console.error('Failed to load contacts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    const interval = setInterval(loadContacts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load Messages for active contact
  const loadMessages = async (contactId) => {
    try {
      const allHistory = await db.history.toArray();
      // Filter history for type='direct-message' with this contact
      const chatMessages = allHistory
        .filter(item => item.type === 'direct-message' && (item.data?.to === contactId || item.data?.from === contactId))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      setMessages(chatMessages);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.nodeId);
      // Poll for new messages when chat is open
      const interval = setInterval(() => loadMessages(activeContact.nodeId), 2000);
      return () => clearInterval(interval);
    }
  }, [activeContact]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeContact || !isReady) return;
    
    const text = inputText.trim();
    setInputText('');

    const payload = {
      text,
      timestamp: Date.now()
    };

    try {
      // 1. Send via mesh
      await sendDirect(activeContact.nodeId, JSON.stringify(payload));
      
      // 2. Save to local history
      await db.history.put({
        timestamp: payload.timestamp,
        type: 'direct-message',
        data: {
          to: activeContact.nodeId,
          from: nodeId,
          text: payload.text
        }
      });
      
      loadMessages(activeContact.nodeId);
    } catch (err) {
      console.error('Send failed', err);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Failed to send message.' } }));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadContacts();
    return Promise.resolve();
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // -----------------------------------------------------
  // CHAT VIEW
  // -----------------------------------------------------
  if (activeContact) {
    return (
      <div className="flex flex-col h-full pb-48">
        {/* Header */}
        <div className="p-4 bg-[#1C1C1E] border-b border-slate-800 flex items-center gap-4 shrink-0">
          <button 
            onClick={() => setActiveContact(null)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">{activeContact.alias}</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ID: {activeContact.nodeId.slice(0, 6)}</p>
            </div>
          </div>
        </div>

        {/* Message Feed */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 opacity-50">
              <MessageSquare size={40} strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-widest font-black">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.data.from === nodeId;
              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className={`
                    max-w-[80%] px-4 py-3 rounded-2xl relative overflow-hidden shadow-sm text-sm
                    ${isMine 
                      ? 'bg-[#0A84FF] text-white rounded-tr-sm' 
                      : 'bg-[#2C2C2E] border border-slate-700 text-slate-100 rounded-tl-sm'
                    }
                  `}>
                    <p className="whitespace-pre-wrap">{msg.data.text}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mt-1 mx-1 flex items-center gap-1">
                    <Clock size={10} /> {formatTime(msg.timestamp)}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#1C1C1E] border-t border-slate-800 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={`Message ${activeContact.alias}...`}
              className="flex-1 bg-[#2C2C2E] border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || !isReady}
              className="w-12 h-12 shrink-0 bg-[#0A84FF] text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
            >
              <Send size={18} className={inputText.trim() ? "ml-1" : ""} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // ADDRESS BOOK VIEW
  // -----------------------------------------------------
  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6 pb-48">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-h1 text-white">Direct Comms</h1>
            <p className="text-body-sm text-slate-400">Encrypted peer-to-peer messages</p>
          </div>
        </div>

        {/* Contact List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#0A84FF]" size={24} />
            </div>
          ) : contacts.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto text-slate-500">
                <Users size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-h3 text-white">No Contacts</h3>
                <p className="text-body-sm text-slate-500 max-w-xs mx-auto">
                  Link with nearby nodes using manual link (QR) or auto-discovery to build your mesh address book.
                </p>
              </div>
            </div>
          ) : (
            contacts.map(contact => (
              <motion.div 
                key={contact.nodeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveContact(contact)}
                className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-600 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2E] border border-slate-700 flex items-center justify-center text-slate-300">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{contact.alias}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      Last seen: {formatTime(contact.lastSeen)}
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400">
                  <MessageSquare size={14} />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
