import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ShieldAlert } from 'lucide-react';

export const ReconstructionUI = ({ totalShards, receivedShards }) => {
  if (!totalShards) return null;

  // Create an array representing slots
  const slots = Array.from({ length: totalShards }).map((_, i) => {
    // Check if we have this specific shard index
    const hasShard = receivedShards.some(s => s.shardIndex === i);
    return { index: i, filled: hasShard };
  });

  const isComplete = receivedShards.length >= totalShards;

  return (
    <div className="w-full flex flex-col gap-3 mt-4 p-4 bg-black/40 rounded-2xl border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Assembly Matrix
        </span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isComplete ? 'text-primary' : 'text-accent'}`}>
          {isComplete ? 'INTEGRITY 100%' : 'RECOVERING...'}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {slots.map(slot => (
          <motion.div
            key={slot.index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-500 ${
              slot.filled 
                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(0,255,170,0.3)]' 
                : 'bg-white/5 border-white/10 text-slate-600 border-dashed'
            }`}
          >
            {slot.filled ? <Check size={14} strokeWidth={4} /> : <X size={14} className="opacity-30" />}
          </motion.div>
        ))}
      </div>
      
      {!isComplete && (
        <div className="flex items-center gap-2 mt-2">
          <ShieldAlert size={14} className="text-accent animate-pulse" />
          <p className="text-xs text-slate-400 font-medium">Scanning local mesh for missing fragments...</p>
        </div>
      )}
    </div>
  );
};
