import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Plus, 
  Scan, 
  Trash2, 
  Info, 
  History, 
  Radio, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useStore } from './store/useStore';
import { agentService } from './services/agentService';
import MessageCreator from './components/MessageCreator';
import QRScanner from './components/QRScanner';
import MessageList from './components/MessageList';
import ShardViewer from './components/ShardViewer';
import Onboarding from './components/Onboarding';
import { cn } from './lib/utils';

export default function App() {
  const { init, loading, messages, shards, wipeData } = useStore();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'create', 'scan', 'history', 'shards'
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('shardnet_onboarded'));
  
  useEffect(() => {
    init();
  }, [init]);

  const suggestions = agentService.analyzeNetwork(messages, shards);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 font-mono">
        <Shield className="w-12 h-12 text-emerald-500 animate-pulse mb-4" />
        <p className="animate-pulse tracking-[0.2em] font-bold">INITIALIZING_SHARDNET.EXE</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono selection:bg-emerald-500/30 overflow-x-hidden">
      <div className="scanline" />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center text-black font-black text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)]">
            S#
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">ShardNet v1.0.4</h1>
            <p className="text-[9px] text-emerald-500 uppercase tracking-widest opacity-80 font-bold mt-1">Self-Healing Info Network // Offline Active</p>
          </div>
        </div>
        
        <div className="hidden md:flex gap-6 items-center text-[10px] font-bold uppercase">
          <div className="flex flex-col items-end">
            <span className="text-zinc-500">Storage</span>
            <div className="w-24 h-1 bg-zinc-800 mt-1">
              <div className="w-1/4 h-full bg-emerald-500 glow-emerald"></div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 block">Trust</span>
            <span className="text-white">98.42%</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (confirm('CRITICAL ERROR: Initiate device wipe sequence?')) {
                wipeData();
              }
            }}
            className="p-2 text-zinc-600 hover:text-red-500 transition-all rounded hover:bg-red-500/10"
            title="Wipe Device"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6 pb-24">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Agent Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase flex items-center gap-2">
                    <Radio className="w-3 h-3 text-emerald-500" />
                    Agent_Insights
                  </h2>
                  <div className="space-y-1">
                    {suggestions.map((s) => (
                      <div 
                        key={s.id}
                        className={cn(
                          "px-3 py-2 rounded border text-[11px] flex items-center gap-2 shadow-sm font-bold",
                          s.priority === 'emergency' 
                            ? "bg-red-950/20 border-red-500/30 text-red-500" 
                            : "bg-emerald-950/20 border-emerald-500/30 text-emerald-500"
                        )}
                      >
                        {s.priority === 'emergency' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        {s.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h2 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Incoming_Data</h2>
                  <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{messages.length} Active</span>
                </div>
                <MessageList messages={messages} />
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <MessageCreator onComplete={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <QRScanner onComplete={() => setView('dashboard')} />
            </motion.div>
          )}

          {view === 'shards' && (
            <motion.div 
              key="shards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ShardViewer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-3 max-w-md mx-auto flex items-center justify-around shadow-[0_-10px_20px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => setView('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-colors", view === 'dashboard' ? "text-emerald-500" : "text-zinc-600")}
        >
          <History className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Feed</span>
        </button>
        
        <button 
          onClick={() => setView('scan')}
          className={cn("flex flex-col items-center gap-1 transition-colors", view === 'scan' ? "text-emerald-500" : "text-zinc-600")}
        >
          <Scan className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Scan</span>
        </button>

        <div className="relative -top-6">
          <button 
            onClick={() => setView('create')}
            className="w-14 h-14 bg-emerald-500 rounded-sm flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8 text-black font-black" />
          </button>
        </div>

        <button 
          onClick={() => setView('shards')}
          className={cn("flex flex-col items-center gap-1 transition-colors", view === 'shards' ? "text-emerald-500" : "text-zinc-600")}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Shards</span>
        </button>

        <div className="flex flex-col items-center gap-1 text-zinc-700">
          <WifiOff className="w-5 h-5" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Offline</span>
        </div>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('shardnet_onboarded', 'true');
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}
