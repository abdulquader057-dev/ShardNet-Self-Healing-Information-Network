import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Siren, 
  CheckCircle, 
  Send, 
  MapPin, 
  Clock, 
  SlidersHorizontal, 
  X, 
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldAlert,
  Battery
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function Inbox() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('all'); // all | active | resolved
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [activeBannerDismissed, setActiveBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pre-populate mock signals in global window.sharedNetData if empty
  useEffect(() => {
    if (!window.sharedNetData) {
      window.sharedNetData = { signals: [] };
    }
    if (!window.sharedNetData.signals || window.sharedNetData.signals.length === 0) {
      window.sharedNetData.signals = [
        {
          id: 'mock-1',
          type: 'received',
          title: 'Hiker-42 Emergency SOS',
          status: 'active',
          time: '4 min ago',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
          location: '120m northeast',
          description: "Distress signal from hiker. Message: 'Twisted ankle, cannot walk. Need medical assistance.'",
          sender: 'Hiker-42',
          range: '120m',
          battery: '34%'
        },
        {
          id: 'mock-2',
          type: 'received',
          title: 'Vehicle Collision Alert',
          status: 'resolved',
          time: 'Yesterday, 6:42 PM',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          location: '450m south',
          description: "Multi-vehicle accident reported. Emergency services dispatched. All victims evacuated safely.",
          sender: 'Vehicle-A1',
          range: '450m',
          battery: '82%'
        },
        {
          id: 'mock-3',
          type: 'sent',
          title: 'Your SOS Signal',
          status: 'sent',
          time: 'Today, 08:15 AM',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          location: 'Your location',
          description: "Test signal sent successfully. 3 nearby devices notified.",
          sender: 'You (Self)',
          range: 'Local Transceiver',
          battery: '84%'
        },
        {
          id: 'mock-4',
          type: 'sent',
          title: 'Test Ping',
          status: 'sent',
          time: 'Today, 07:30 AM',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          location: 'Your location',
          description: "Network connectivity test. All systems operational.",
          sender: 'You (Self)',
          range: 'Local Transceiver',
          battery: '84%'
        }
      ];
    }

    // Load signals from global store
    // Reversing to show newest first
    const sortedSignals = [...window.sharedNetData.signals].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    setSignals(sortedSignals);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    const handleDemoChange = () => {
      const sortedSignals = [...window.sharedNetData.signals].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      setSignals(sortedSignals);
    };
    window.addEventListener('demo-mode-changed', handleDemoChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('demo-mode-changed', handleDemoChange);
    };
  }, []);

  const refreshSignalsList = () => {
    const sortedSignals = [...window.sharedNetData.signals].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    setSignals(sortedSignals);
  };

  const handleMarkResolved = (signalId) => {
    // Update global store
    if (window.sharedNetData && window.sharedNetData.signals) {
      window.sharedNetData.signals = window.sharedNetData.signals.map(sig => {
        if (sig.id === signalId) {
          return { ...sig, status: 'resolved', time: 'Just now' };
        }
        return sig;
      });
    }

    // Sound alert chime confirmation
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.linearRampToValueAtTime(784, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.2);
      }
    } catch(e) {}

    // Vibrate success chime
    try {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch(e) {}

    alert("Signal marked as resolved. Broadcast status updated across mesh.");
    refreshSignalsList();
    if (selectedSignal && selectedSignal.id === signalId) {
      setSelectedSignal(prev => ({ ...prev, status: 'resolved' }));
    }
  };

  const handleResend = (sig) => {
    alert(`Re-broadcasting payload: "${sig.title}" across mesh network...`);
    try {
      if (navigator.vibrate) navigator.vibrate(100);
    } catch(e) {}
  };

  // Filter logic
  const filteredSignals = signals.filter(sig => {
    if (filter === 'active') return sig.status === 'active';
    if (filter === 'resolved') return sig.status === 'resolved';
    return true; // 'all'
  });

  const activeEmergency = signals.find(s => s.status === 'active');

  return (
    <div className="space-y-6 pb-28 relative">
      
      {/* ── STICKY ACTIVE EMERGENCY BANNER (Instruction 2) ── */}
      {activeEmergency && !activeBannerDismissed && (
        <div 
          className="sticky top-[12px] z-50 p-4 rounded-xl flex items-center justify-between gap-4 border border-[#FF3B30]/30 shadow-[0_0_30px_rgba(255,59,48,0.35)]"
          style={{ 
            background: 'linear-gradient(135deg, #FF3B30 0%, #D32F2F 100%)',
            touchAction: 'manipulation'
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 animate-pulse">
              <i className="ph-fill ph-siren" style={{ fontSize: '24px' }}></i>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full block w-fit mb-1">
                Active Emergency
              </span>
              <h4 className="font-bold text-white text-sm truncate">{activeEmergency.title}</h4>
              <p className="text-[10px] text-white/90 truncate">{activeEmergency.time} • {activeEmergency.range} away</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                navigate('/pulse');
                alert("Opening tactical telemetry map to intercept coordinates.");
              }}
              className="px-4 py-2 bg-white text-[#FF3B30] rounded-lg text-xs font-bold shrink-0 shadow-lg active:scale-95 transition-transform"
            >
              Respond
            </button>
            <button 
              onClick={() => setActiveBannerDismissed(true)}
              className="p-1 text-white/80 hover:text-white shrink-0"
              aria-label="Dismiss banner alert"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN HEADER ── */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-h1 text-white">Emergency Feed</h1>
          <p className="text-body-sm text-slate-400">Signals from your mesh network</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${showFilters ? 'bg-[#0A84FF] text-white' : 'glass text-slate-400'}`}
          aria-label="Toggle feed filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Expandable Filter Bar */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-2 bg-[#1C1C1E] border border-slate-800 rounded-xl">
              {['all', 'active', 'resolved'].map(type => {
                const isActive = filter === type;
                const label = type.charAt(0).toUpperCase() + type.slice(1);
                
                return (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                      isActive 
                        ? 'bg-[#0A84FF] text-white shadow-lg' 
                        : 'text-slate-400 hover:text-white bg-transparent'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TIMELINE FEED ── */}
      <div className="relative pl-6">
        
        {/* Timeline Axis vertical line */}
        {filteredSignals.length > 0 && (
          <div 
            className="absolute left-6 top-4 bottom-4 w-[2px]" 
            style={{ background: 'var(--border-subtle, #38383A)' }}
          />
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="py-20 text-center text-slate-500 animate-pulse font-black uppercase text-[10px] tracking-widest">
              Gossip Synchronization...
            </div>
          ) : filteredSignals.length === 0 ? (
            // Empty State (Instruction 5)
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800/20 flex items-center justify-center mx-auto text-slate-500">
                <i className="ph-bold ph-shield-check" style={{ fontSize: '36px' }}></i>
              </div>
              <div className="space-y-1">
                <h3 className="text-h3 text-white">
                  {filter === 'active' ? 'No active emergencies' : 'No emergency signals'}
                </h3>
                <p className="text-body-sm text-slate-500 max-w-xs mx-auto">
                  {filter === 'active' 
                    ? "Your local airspace is quiet. All mesh nodes report stable status."
                    : "Your mesh network is quiet. That's a good thing."}
                </p>
              </div>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-sos'));
                }}
                className="btn-primary !w-auto mx-auto !py-2.5 !px-6 !text-xs !bg-transparent border border-[#0A84FF] text-[#0A84FF] hover:bg-[#0A84FF]/5"
              >
                Send Test Signal
              </button>
            </div>
          ) : (
            filteredSignals.map(sig => {
              const isActive = sig.status === 'active';
              const isResolved = sig.status === 'resolved';
              const isSent = sig.status === 'sent';

              // Dot colors & shadow classes
              let dotColorClass = 'bg-[#0A84FF] shadow-[0_0_0_4px_rgba(10,132,255,0.2)]';
              if (isActive) dotColorClass = 'bg-[#FF3B30] shadow-[0_0_0_4px_rgba(255,59,48,0.2)] animate-pulse';
              else if (isResolved) dotColorClass = 'bg-[#34C759] shadow-[0_0_0_4px_rgba(52,199,89,0.2)]';

              // Header Pill colors
              const pillColors = {
                active: 'status-pill--emergency',
                resolved: 'status-pill--success',
                sent: 'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30'
              };

              // Header Icon type
              let Icon = Siren;
              if (isResolved) Icon = CheckCircle;
              else if (isSent) Icon = Send;

              return (
                <div key={sig.id} className="relative pl-8">
                  
                  {/* Timeline Node Dot (Instruction 3) */}
                  <div className={`absolute -left-10 top-4 w-3.5 h-3.5 rounded-full z-10 ${dotColorClass}`} />

                  {/* Signal Card container */}
                  <div className="card p-5 bg-[#1C1C1E] border border-slate-800 rounded-xl relative hover:border-slate-700 transition-colors">
                    
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div className="flex items-center gap-2 text-white">
                        <Icon size={18} className={isActive ? 'text-[#FF3B30]' : isResolved ? 'text-[#34C759]' : 'text-[#0A84FF]'} />
                        <span className="font-bold text-sm">{sig.title}</span>
                      </div>
                      
                      <span className={`status-pill ${pillColors[sig.status] || ''}`}>
                        {sig.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-body-sm text-slate-400 leading-relaxed mb-4">
                      {sig.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-caption text-slate-500 font-mono mb-4 border-t border-slate-800/60 pt-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-[#0A84FF]" />
                        <span>{sig.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{sig.time}</span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex gap-2">
                      {isActive && (
                        <>
                          <button
                            onClick={() => handleMarkResolved(sig.id)}
                            className="h-9 px-4 rounded-lg bg-[#34C759] text-white font-bold text-xs uppercase hover:bg-emerald-600 active:scale-95 transition-transform"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => {
                              navigate('/pulse');
                              alert("Opening telemetry map coordinates.");
                            }}
                            className="h-9 px-4 rounded-lg bg-transparent border border-slate-700 text-slate-300 font-bold text-xs uppercase hover:bg-slate-800/40 active:scale-95 transition-transform"
                          >
                            View on Map
                          </button>
                        </>
                      )}

                      {isSent && (
                        <>
                          <button
                            onClick={() => handleResend(sig)}
                            className="h-9 px-4 rounded-lg bg-transparent border border-[#0A84FF] text-[#0A84FF] font-bold text-xs uppercase hover:bg-[#0A84FF]/5 active:scale-95 transition-transform"
                          >
                            Resend
                          </button>
                          <button
                            onClick={() => setSelectedSignal(sig)}
                            className="h-9 px-4 rounded-lg bg-transparent border border-slate-700 text-slate-300 font-bold text-xs uppercase hover:bg-slate-800/40 active:scale-95 transition-transform"
                          >
                            View Details
                          </button>
                        </>
                      )}

                      {isResolved && (
                        <button
                          onClick={() => setSelectedSignal(sig)}
                          className="h-9 px-4 rounded-lg bg-transparent border border-slate-700 text-slate-300 font-bold text-xs uppercase hover:bg-slate-800/40 active:scale-95 transition-transform"
                        >
                          View Details
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── SIGNAL DETAIL MODAL OVERLAY (Instruction 6) ── */}
      <AnimatePresence>
        {selectedSignal && (
          <div 
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-signal-title"
          >
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setSelectedSignal(null)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#1C1C1E] border border-slate-800 w-full max-w-sm rounded-xl p-6 relative z-10 flex flex-col gap-5 shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <h2 id="modal-signal-title" className="text-h2 text-white font-bold">{selectedSignal.title}</h2>
                  <span className={`status-pill block w-fit ${
                    selectedSignal.status === 'active' ? 'status-pill--emergency' :
                    selectedSignal.status === 'resolved' ? 'status-pill--success' :
                    'bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/30'
                  }`}>
                    {selectedSignal.status.toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedSignal(null)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  aria-label="Close modal dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="h-[1px] bg-slate-800/80" />

              {/* Detail Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-caption text-slate-500 font-bold block mb-1">Time</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    {selectedSignal.time}
                  </span>
                </div>
                <div>
                  <span className="text-caption text-slate-500 font-bold block mb-1">Location</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <MapPin size={12} className="text-[#0A84FF]" />
                    {selectedSignal.location}
                  </span>
                </div>
                <div>
                  <span className="text-caption text-slate-500 font-bold block mb-1">Sender</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <User size={12} className="text-slate-500" />
                    {selectedSignal.sender || 'Unknown Node'}
                  </span>
                </div>
                <div>
                  <span className="text-caption text-slate-500 font-bold block mb-1">Range</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    <ArrowLeftRight size={12} className="text-[#0A84FF]" />
                    {selectedSignal.range || '150m (approx)'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-caption text-slate-500 font-bold block mb-1">Battery Diagnostic</span>
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Battery size={14} className="text-slate-500" />
                    {selectedSignal.battery || '84% Stable'}
                  </span>
                </div>
              </div>

              {/* Message Block */}
              <div className="bg-[#2C2C2E] border border-slate-850 p-4 rounded-lg text-slate-300 text-xs leading-relaxed">
                {selectedSignal.description}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex gap-2 mt-2">
                {selectedSignal.status === 'active' ? (
                  <>
                    <button
                      onClick={() => handleMarkResolved(selectedSignal.id)}
                      className="flex-1 h-12 rounded-xl bg-[#34C759] text-white font-bold text-xs uppercase active:scale-95 transition-transform"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => setSelectedSignal(null)}
                      className="flex-1 h-12 rounded-xl bg-transparent border border-slate-800 text-slate-400 font-bold text-xs uppercase active:scale-95 transition-transform"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedSignal(null)}
                    className="w-full h-12 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase active:scale-95 transition-transform"
                  >
                    Close
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
