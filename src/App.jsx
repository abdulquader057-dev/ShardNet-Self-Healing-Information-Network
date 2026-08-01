import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateMessage from './pages/CreateMessage';
import StorageView from './pages/StorageView';
import ScanPage from './pages/ScanPage';
import ReconstructedView from './pages/ReconstructedView';
import Inbox from './pages/Inbox';
import BluetoothMesh from './pages/BluetoothMesh';
import MeshPulse from './pages/MeshPulse';
import MeshWhisper from './pages/MeshWhisper';
import SilentRelay from './pages/SilentRelay';
import Settings from './pages/Settings';
import SurvivalKit from './pages/SurvivalKit';
import { performSelfHealing } from './storage/db';
import { messageManager } from './core/messageManager';
import { safeInit, safeInterval, safeCall } from './core/stability';
import ErrorBoundary from './components/ErrorBoundary';
import SOSButtonFlow from './components/SOSButtonFlow';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

function App() {
  const [demoActive, setDemoActive] = useState(localStorage.getItem('sharednet_demo_mode') === 'true');
  const [onboarded, setOnboarded] = useState(localStorage.getItem('sharednet_onboarded') === 'true');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // 1. Initialize Core Engines
    safeInit("Message Manager", () => {
      messageManager.init();
    });

    // 2. Scheduled Self-Healing (Harnessed)
    const cleanup = safeInterval(async () => {
      await performSelfHealing();
    }, 300000); // 5 minutes

    // 3. Accessibility Initializations
    if (localStorage.getItem('setting_high_contrast') === 'true') {
      document.documentElement.classList.add('high-contrast');
    }
    if (localStorage.getItem('setting_large_text') === 'true') {
      document.documentElement.style.fontSize = '120%';
    }
    if (localStorage.getItem('setting_reduce_motion') === 'true') {
      document.documentElement.classList.add('reduce-motion');
    }

    // 4. Listeners for Demo Mode change
    const handleDemoChange = () => {
      setDemoActive(localStorage.getItem('sharednet_demo_mode') === 'true');
    };
    window.addEventListener('demo-mode-changed', handleDemoChange);

    // 5. Toast listener
    const handleToast = (e) => {
      const id = Math.random().toString();
      const newToast = { id, ...e.detail };
      setToasts(prev => [...prev, newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('show-toast', handleToast);

    return () => {
      safeCall(cleanup, "Interval Cleanup");
      window.removeEventListener('demo-mode-changed', handleDemoChange);
      window.removeEventListener('show-toast', handleToast);
    };
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('sharednet_onboarded', 'true');
    setOnboarded(true);
  };

  return (
    <Router>
      <div className="app-container flex flex-col min-h-screen">
        
        {/* ── PERSISTENT DEMO MODE BANNER (Instruction 2) ── */}
        {demoActive && (
          <div 
            className="bg-[#FF9500] text-black text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center shrink-0 z-[10000]" 
            style={{ height: '28px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
          >
            Demo Mode Active
          </div>
        )}

        <div className="noise-overlay" />
        <Navbar />
        <SOSButtonFlow />

        {/* ── TOAST NOTIFICATIONS DRAWER (Instruction 4) ── */}
        <div className="toast-container fixed top-[56px] left-4 right-4 z-[99999] pointer-events-none flex flex-col gap-2">
          <AnimatePresence>
            {toasts.map(toast => {
              const colors = {
                success: 'border-l-[#34C759] bg-[#1C1C1E]',
                error: 'border-l-[#FF3B30] bg-[#1C1C1E]',
                info: 'border-l-[#0A84FF] bg-[#1C1C1E]'
              };
              const Icons = {
                success: <CheckCircle className="text-[#34C759]" size={16} />,
                error: <AlertTriangle className="text-[#FF3B30]" size={16} />,
                info: <Info className="text-[#0A84FF]" size={16} />
              };

              return (
                <motion.div
                  key={toast.id}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className={`p-4 border-l-4 rounded-lg shadow-2xl flex items-center gap-3 pointer-events-auto border border-slate-800/80 ${colors[toast.type] || colors.info}`}
                >
                  {Icons[toast.type] || Icons.info}
                  <span className="text-white text-xs font-bold">{toast.message}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── MAIN ROUTER SCREEN OVERLAY ── */}
        <main className="ui-overlay flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/create"      element={<CreateMessage />} />
              <Route path="/storage"     element={<StorageView />} />
              <Route path="/scan"        element={<ScanPage />} />
              <Route path="/bluetooth"   element={<BluetoothMesh />} />
              <Route path="/reconstructed" element={<ReconstructedView />} />
              <Route path="/hub"         element={<ReconstructedView />} />
              <Route path="/inbox"       element={<Inbox />} />
              <Route path="/pulse"       element={<MeshPulse />} />
              <Route path="/whisper"     element={<MeshWhisper />} />
              <Route path="/relay"       element={<SilentRelay />} />
              <Route path="/settings"    element={<Settings />} />
              <Route path="/survival"    element={<SurvivalKit />} />
              <Route path="/index.html"  element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* ── FIRST-TIME ONBOARDING FLOW OVERLAY (Instruction 1) ── */}
        {!onboarded && (
          <div className="onboarding fixed inset-0 z-[100000] bg-[#0A0A0F] flex flex-col justify-between p-6">
            
            {/* Background gradient flare */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(10,132,255,0.06) 0%, transparent 65%)' }} />

            {/* Skip Option at top */}
            <div className="flex justify-end z-10">
              <button 
                onClick={handleFinishOnboarding}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider py-2 px-4"
              >
                Skip
              </button>
            </div>

            {/* Slide Content wrapper with AnimatePresence */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto z-10">
              <AnimatePresence mode="wait">
                {currentSlide === 0 && (
                  <motion.div
                    key="slide0"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#0A84FF]/10 flex items-center justify-center border border-[#0A84FF]/20 shadow-[0_0_20px_rgba(10,132,255,0.1)]">
                      <i className="ph-fill ph-broadcast text-[#0A84FF] animate-pulse" style={{ fontSize: '56px' }} />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">No Signal?<br/>No Problem.</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        SharedNet creates a direct connection between nearby phones. No towers. No internet. Just you and the people around you.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentSlide === 1 && (
                  <motion.div
                    key="slide1"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#FF3B30]/10 flex items-center justify-center border border-[#FF3B30]/20 shadow-[0_0_20px_rgba(255,59,48,0.1)]">
                      <i className="ph-fill ph-siren text-[#FF3B30] animate-bounce" style={{ fontSize: '56px' }} />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">One Tap SOS</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        In an emergency, tap the red SOS button. Your signal reaches every device in range instantly — even if you're underground or in a remote area.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentSlide === 2 && (
                  <motion.div
                    key="slide2"
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 rounded-full bg-[#34C759]/10 flex items-center justify-center border border-[#34C759]/20 shadow-[0_0_20px_rgba(52,199,89,0.1)]">
                      <i className="ph-fill ph-shield-check text-[#34C759]" style={{ fontSize: '56px' }} />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">You're Protected</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Your device is now part of the rescue network. Stay safe, and help others stay safe too.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Slide Navigation footer */}
            <div className="space-y-6 max-w-sm w-full mx-auto z-10 pb-6">
              
              {/* Pagination Dots */}
              <div className="flex justify-center items-center gap-2">
                {[0, 1, 2].map(idx => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx 
                        ? 'w-6 bg-[#0A84FF]' 
                        : 'w-2 bg-[#2C2C2E]'
                    }`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {currentSlide < 2 ? (
                  <button
                    onClick={() => setCurrentSlide(prev => prev + 1)}
                    className="w-full py-4 bg-[#0A84FF] text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg active:scale-[0.99] transition-transform"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleFinishOnboarding}
                    className="w-full py-4 bg-[#34C759] text-white rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg active:scale-[0.99] transition-transform"
                  >
                    Get Started
                  </button>
                )}
              </div>

            </div>

          </div>
        )}

      </div>
    </Router>
  );
}

export default App;
