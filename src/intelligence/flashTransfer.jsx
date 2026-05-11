import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Monitor } from 'lucide-react';
import { safeInterval } from '../core/stability';

/**
 * ShardNet Optical Flash Transmission (Experimental)
 * Encodes shard data into rapid light pulses for line-of-sight communication.
 */
const FlashTransmitter = ({ data }) => {
  const [isActive, setIsActive] = useState(false);
  const [binary, setBinary] = useState('');
  const [currentBit, setCurrentBit] = useState(0);

  useEffect(() => {
    if (isActive && data) {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const bin = str.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
      ).join('');
      setBinary(bin);
      setCurrentBit(0);
    }
  }, [isActive, data]);

  useEffect(() => {
    let interval;
    if (isActive && binary.length > 0) {
      interval = safeInterval(() => {
        setCurrentBit(prev => (prev + 1) % binary.length);
      }, 50); // 20bps experimental rate
    }
    return () => clearInterval(interval);
  }, [isActive, binary]);

  const isHigh = binary[currentBit] === '1';

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsActive(!isActive)}
        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all ${
          isActive ? 'bg-danger text-white shadow-lg shadow-danger/20' : 'bg-white/5 text-slate-400 border border-white/10'
        }`}
      >
        <Zap size={18} className={isActive ? 'animate-pulse' : ''} />
        {isActive ? 'HALT OPTICAL BEAM' : 'INITIALIZE OPTICAL BEAM'}
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative h-64 rounded-3xl overflow-hidden border-4 border-white/10"
          >
            {/* The Flash Surface */}
            <div 
              className={`w-full h-full transition-colors duration-75 ${
                isHigh ? 'bg-white' : 'bg-black'
              }`} 
            />
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <Monitor size={14} className="text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-100">
                Transmitting: {Math.round((currentBit / binary.length) * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="text-[9px] font-black uppercase text-slate-600 text-center tracking-[0.2em]">
        Experimental Line-of-Sight Module
      </p>
    </div>
  );
};

export default FlashTransmitter;
