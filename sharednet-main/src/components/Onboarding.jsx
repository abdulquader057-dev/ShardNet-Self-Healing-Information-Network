import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  WifiOff, 
  RefreshCw, 
  Scan, 
  ChevronRight, 
  X,
  Lock,
  Layers,
  Zap
} from 'lucide-react';

const slides = [
  {
    title: "THE SHARDNET",
    description: "Welcome to a self-healing information network. ShardNet is designed for extreme resilience in communication-denied environments.",
    icon: Shield,
    color: "blue"
  },
  {
    title: "AIR-GAPPED BY DESIGN",
    description: "ShardNet works 100% offline. No servers, no tracking, no identity. Your device is a node in a decentralized mesh.",
    icon: WifiOff,
    color: "emerald"
  },
  {
    title: "FRAGMENT & PROTECT",
    description: "Messages are split into 'shards'. Distribute these fragments via QR codes. A message can only be read when enough shards are re-collected.",
    icon: Layers,
    color: "purple"
  },
  {
    title: "P2P PROPAGATION",
    description: "Scan shards from others to help relay them. The more devices participate, the more resilient the information becomes.",
    icon: Scan,
    color: "amber"
  }
];

export default function Onboarding({ onClose }) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current === slides.length - 1) {
      onClose();
    } else {
      setCurrent(current + 1);
    }
  };

  const SlideIcon = slides[current].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950 font-mono">
      <div className="absolute top-8 right-8">
        <button onClick={onClose} className="p-2 text-zinc-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className={`p-8 rounded-sm bg-${slides[current].color}-500/10 text-${slides[current].color}-500 shadow-2xl`}>
              <SlideIcon className="w-16 h-16" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic leading-none">
                {slides[current].title}
              </h2>
              <p className="text-zinc-500 leading-snug font-bold text-xs uppercase tracking-widest">
                {slides[current].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="w-full mt-16 space-y-8">
          <div className="flex gap-2 justify-center">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 transition-all duration-300 ${i === current ? 'w-12 bg-emerald-500' : 'w-2 bg-zinc-800'}`} 
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-full h-16 bg-emerald-500 text-black font-black flex items-center justify-center gap-2 group active:scale-95 transition-all shadow-xl shadow-emerald-500/10 uppercase tracking-[0.2em] text-[11px]"
          >
            {current === slides.length - 1 ? 'ACTIVATE_NODE' : 'NEXT_PROTOCOL'}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
