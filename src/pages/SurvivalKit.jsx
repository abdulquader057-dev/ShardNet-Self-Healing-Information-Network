import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Volume2, Zap, Thermometer, Droplets, MapPin, 
  Search, AlertTriangle, Pill, Activity, Wind, Info, 
  X
} from 'lucide-react';
import { MEDICINES, SURVIVAL_MEASURES, GLOBAL_HUBS, INFRA_ICONS } from '../data/emergencyData';
import { safeInterval } from '../core/stability';

/* ─── TACTICAL SIREN GENERATOR ────────────────────────────────────────── */
const playTacticalSiren = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1);
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 2);
    
    osc2.frequency.setValueAtTime(380, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.8);
    osc2.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 1.6);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 2);
    osc2.stop(ctx.currentTime + 2);
  } catch (e) {
    console.warn("Audio Context Init Failed", e);
  }
};

const SurvivalKit = () => {
  const [activeView, setActiveView] = useState('FIRST AID'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSirenActive, setIsSirenActive] = useState(false);

  const filteredMeds = MEDICINES.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMeasures = SURVIVAL_MEASURES.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let cleanup = null;
    if (isSirenActive) {
      playTacticalSiren(); // Play once immediately
      cleanup = safeInterval(playTacticalSiren, 2100);
    }
    return () => { if (cleanup) cleanup(); };
  }, [isSirenActive]);

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-primary" size={28} />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tactical Support</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSirenActive(!isSirenActive)}
            className={`px-4 py-2 rounded-xl font-black text-[14px] tracking-widest border transition-all ${isSirenActive ? 'bg-danger border-danger animate-pulse shadow-lg shadow-danger/40' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            {isSirenActive ? 'STOP SIREN' : 'SIREN SOS'}
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="SEARCH MEDICINES, HOSPITALS, OR PROTOCOLS..."
          className="w-full bg-surface border-2 border-white/5 focus:border-primary/40 rounded-2xl py-4 pl-14 pr-6 text-sm font-black uppercase tracking-wider focus:outline-none transition-all shadow-2xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex bg-surface p-1.5 rounded-2xl border border-white/5 gap-1 shadow-inner">
        {['FIRST AID', 'MAP SEARCH', 'SIGNALS'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab)}
            className={`flex-1 py-3 rounded-xl font-black text-[14px] tracking-widest transition-all ${activeView === tab ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeView === 'FIRST AID' && (
            <motion.div 
              key="first-aid"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Pill size={16} className="text-secondary" />
                  <span className="text-[14px] font-black uppercase tracking-[0.2em] text-secondary">Apothecary Index</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMeds.map(med => (
                    <div key={med.name} className="glass p-5 rounded-3xl border-white/5 space-y-2 hover:border-secondary/30 transition-all group">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-lg text-slate-100 italic">{med.name}</h4>
                        <span className="bg-secondary/10 text-secondary text-[14px] font-black px-2 py-1 rounded-full">{med.type}</span>
                      </div>
                      <p className="text-[14px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">{med.use}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <Activity size={16} className="text-primary" />
                  <span className="text-[14px] font-black uppercase tracking-[0.2em] text-primary">Survival Protocols</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {filteredMeasures.map(measure => (
                    <div key={measure.title} className="glass p-6 rounded-[2.5rem] border-white/5 space-y-4">
                      <h4 className="font-black text-xl text-slate-100 uppercase italic tracking-tighter">{measure.title}</h4>
                      <div className="space-y-3">
                        {measure.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[14px] font-black shrink-0 text-primary">{idx + 1}</span>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'MAP SEARCH' && (
            <motion.div 
              key="map-search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 px-2">
                <MapPin size={16} className="text-accent" />
                <span className="text-[14px] font-black uppercase tracking-[0.2em] text-accent">Resilience Index (India Focus)</span>
              </div>
              <div className="space-y-3">
                {GLOBAL_HUBS.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase())).map(hub => (
                  <div key={hub.id} className="glass p-5 rounded-3xl border-white/5 flex justify-between items-center group hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/5">
                        {INFRA_ICONS[hub.type]?.emoji || '📍'}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-100 uppercase text-sm tracking-tight">{hub.name}</h4>
                        <p className="text-[14px] text-slate-500 font-bold uppercase tracking-widest">{hub.info}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[14px] font-mono text-slate-600">{hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}</p>
                       <span className={`text-[14px] font-black uppercase px-2 py-0.5 rounded-md mt-1 inline-block ${hub.id.startsWith('in') ? 'bg-orange-500/20 text-orange-500' : 'bg-primary/20 text-primary'}`}>
                         {hub.id.startsWith('in') ? 'INDIA REGION' : 'GLOBAL HUB'}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'SIGNALS' && (
            <motion.div 
              key="signals"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 space-y-8"
            >
               <div className="w-48 h-48 rounded-full border-4 border-danger/20 flex items-center justify-center relative">
                  <div className={`absolute inset-0 rounded-full border-4 border-danger animate-ping opacity-40 ${isSirenActive ? '' : 'hidden'}`} />
                  <Volume2 size={64} className={isSirenActive ? 'text-danger animate-bounce' : 'text-slate-700'} />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-100">Tactical SOS Siren</h3>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest max-w-xs mx-auto">
                   Generates high-decibel harmonic interference for maximum audio penetration in survival environments.
                 </p>
               </div>
               <button 
                 onClick={() => setIsSirenActive(!isSirenActive)}
                 className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all ${isSirenActive ? 'bg-danger text-white shadow-2xl shadow-danger/40' : 'bg-white/5 border-2 border-white/10 text-slate-500 hover:text-slate-300'}`}
               >
                 {isSirenActive ? 'DEACTIVATE SIGNAL' : 'ACTIVATE SIGNAL'}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SurvivalKit;
