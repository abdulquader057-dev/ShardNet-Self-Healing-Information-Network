import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Activity, Phone, ChevronDown, Save, Heart } from 'lucide-react';
import { Haptics } from './haptics';

export const EmergencyCard = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState({
    name: '',
    bloodGroup: '',
    contact: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('shardnet_emergency_profile');
    if (saved) {
      try { setProfile(JSON.parse(saved)); } catch(e){}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('shardnet_emergency_profile', JSON.stringify(profile));
    Haptics.success();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end justify-center p-4">
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        className="bg-[#0f0f11] border border-white/10 w-full max-w-md rounded-t-3xl p-6 shadow-2xl flex flex-col gap-6"
      >
        <div className="w-full flex justify-center mb-[-10px]">
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white">
            <ChevronDown size={24} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-danger/20 text-danger border border-danger/30">
            <Heart size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Emergency Identity</h2>
            <p className="text-xs text-slate-400">Attached to all outgoing SOS fragments</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="Full Legal Name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-white font-bold"
            />
          </div>
          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" value={profile.bloodGroup} onChange={e => setProfile({...profile, bloodGroup: e.target.value.toUpperCase()})}
              placeholder="Blood Group (e.g. O+)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-white font-bold"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="tel" value={profile.contact} onChange={e => setProfile({...profile, contact: e.target.value})}
              placeholder="Emergency Contact #"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-white font-bold"
            />
          </div>
          <textarea 
            value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})}
            placeholder="Critical Medical Notes (Allergies, Meds...)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-primary/50 text-white text-sm min-h-[80px]"
          />
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
        >
          <Save size={20} />
          ENCRYPT & SAVE
        </button>
      </motion.div>
    </div>
  );
};
