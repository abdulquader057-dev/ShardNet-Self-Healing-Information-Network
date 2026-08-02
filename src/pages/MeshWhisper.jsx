import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Radio, Volume2, Zap, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * ShardNet Mesh Whisper (Sonic Data Pulse)
 * Experimental acoustic modem for silent, short-range metadata sync.
 * Transmits small identifiers via high-frequency audio chirps.
 */
const MeshWhisper = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [detectedSignal, setDetectedSignal] = useState(null);
  
  const audioCtx = useRef(null);
  const analyser = useRef(null);
  const animationFrame = useRef(null);

  // Simple FSK-like detection (Looking for specific frequency peaks)
  const BEACON_FREQ = 18000; // 18kHz (Near ultrasonic)

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      analyser.current = audioCtx.current.createAnalyser();
      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      
      analyser.current.fftSize = 2048;
      const bufferLength = analyser.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      setIsListening(true);

      const detect = () => {
        analyser.current.getByteFrequencyData(dataArray);
        const index = Math.floor(BEACON_FREQ / (audioCtx.current.sampleRate / analyser.current.fftSize));
        const magnitude = dataArray[index];
        
        if (magnitude > 200) { // Threshold for detection
          setDetectedSignal({ id: 'MESH_NODE_SIG_BETA', timestamp: Date.now() });
          setTimeout(() => setDetectedSignal(null), 3000);
        }
        
        animationFrame.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (err) {
      console.error('Audio access denied', err);
    }
  };

  const transmitBeacon = () => {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc = audioCtx.current.createOscillator();
    const gain = audioCtx.current.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(BEACON_FREQ, audioCtx.current.currentTime);
    
    gain.gain.setValueAtTime(0, audioCtx.current.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.current.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, audioCtx.current.currentTime + 1.0);
    
    osc.connect(gain);
    gain.connect(audioCtx.current.destination);
    
    setIsTransmitting(true);
    osc.start();
    osc.stop(audioCtx.current.currentTime + 1);
    
    setTimeout(() => setIsTransmitting(false), 1200);
  };

  return (
    <div className="space-y-6">
       <header className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 glass rounded-2xl text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-tight">Mesh Whisper</h1>
          <p className="text-[14px] font-bold text-slate-500 uppercase tracking-widest">Acoustic Proximity Sync</p>
        </div>
      </header>

      <div className="glass p-8 rounded-[3rem] border-white/5 space-y-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Volume2 size={120} />
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div 
            animate={isListening ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors ${
              isListening ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-slate-700'
            }`}
          >
            <Mic size={48} />
          </motion.div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black italic uppercase">Acoustic Intercept</h3>
            <p className="text-[14px] text-slate-500 uppercase tracking-[0.2em] max-w-[200px]">
              Listening for near-ultrasonic metadata chirps from nearby nodes.
            </p>
          </div>

          <button 
            onClick={isListening ? () => setIsListening(false) : startListening}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
              isListening ? 'bg-danger text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'
            }`}
          >
            {isListening ? 'STOP LISTENING' : 'START INTERCEPT'}
          </button>
        </div>

        <div className="border-t border-white/5 pt-12 space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="space-y-2">
              <h3 className="text-lg font-black italic uppercase">Transmit Beacon</h3>
              <p className="text-[14px] text-slate-500 uppercase tracking-[0.2em]">
                Broadcast your node signature via sonic pulse.
              </p>
            </div>
            
            <button 
              disabled={isTransmitting}
              onClick={transmitBeacon}
              className={`w-full py-6 rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center gap-2 ${
                isTransmitting ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
              }`}
            >
              <Volume2 size={32} className={isTransmitting ? 'animate-bounce' : ''} />
              <span className="text-[14px] font-black tracking-widest uppercase">
                {isTransmitting ? 'PULSING...' : 'EMIT SONIC PULSE'}
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {detectedSignal && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute inset-x-8 bottom-8 p-4 bg-secondary text-white rounded-2xl flex items-center gap-4 shadow-2xl border-2 border-white/20"
            >
              <Zap size={24} className="animate-pulse" />
              <div>
                <p className="text-[14px] font-black uppercase tracking-widest opacity-60">Signal Detected</p>
                <p className="text-sm font-bold">{detectedSignal.id}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 glass rounded-[2rem] border-white/5 flex items-start gap-4">
        <AlertTriangle size={20} className="text-warning mt-1" />
        <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
          <span className="text-warning font-black uppercase">Technical Note:</span> Sonic Sync is highly experimental. It uses high-frequency sine waves (18kHz) which may be audible to some users or pets. Use with caution.
        </p>
      </div>
    </div>
  );
};

export default MeshWhisper;
