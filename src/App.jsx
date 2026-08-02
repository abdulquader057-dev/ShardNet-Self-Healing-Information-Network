import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateMessage from './pages/CreateMessage';
import StorageView from './pages/StorageView';
import ScanPage from './pages/ScanPage';
import ReconstructedView from './pages/ReconstructedView';
import Inbox from './pages/Inbox';
import Forum from './pages/Forum';
import Contacts from './pages/Contacts';
import IntelDrop from './pages/IntelDrop';
import OfflineShare from './pages/OfflineShare';
import Squads from './pages/Squads';
import BluetoothMesh from './pages/BluetoothMesh';
import MeshPulse from './pages/MeshPulse';
import MeshWhisper from './pages/MeshWhisper';
import Settings from './pages/Settings';
import SurvivalKit from './pages/SurvivalKit';
import EmergencyContacts from './pages/EmergencyContacts';
import EvidenceCapture from './pages/EvidenceCapture';
import SilentRelay from './pages/SilentRelay';
import { performSelfHealing } from './storage/db';
import { messageManager } from './core/messageManager';
import { safeInit, safeInterval, safeCall } from './core/stability';
import ErrorBoundary from './components/ErrorBoundary';
import SOSButtonFlow from './components/SOSButtonFlow';
import { MeshProvider } from './core/MeshProvider';
import PINLock from './components/PINLock';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AudioEngine, Haptic } from './core/feedback';

function App() {
  // MeshProvider wraps Router so all pages can access useMesh()
  return (
    <MeshProvider>
      <PINLock>
        <AppInner />
      </PINLock>
    </MeshProvider>
  );
}

function AppInner() {
  // Demo mode removed
  const [onboarded, setOnboarded] = useState(localStorage.getItem('sharednet_onboarded') === 'true');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    if (localStorage.getItem('presentation_mode') === 'true') {
      document.documentElement.classList.add('presentation-mode');
    }

    // Demo Mode change listener removed

    // 5. Toast listener
    const handleToast = (e) => {
      const id = Math.random().toString();
      const newToast = { id, ...e.detail };
      setToasts(prev => [...prev, newToast]);
      
      const presMode = localStorage.getItem('presentation_mode') === 'true';
      if (!presMode) {
        const dismissTimeout = setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
        newToast.timeoutId = dismissTimeout;
      }
    };
    window.addEventListener('show-toast', handleToast);

    // 6. Network connectivity triggers (Instruction 2)
    const handleOnlineStatus = () => {
      setIsOnline(true);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'success', message: 'Transceiver back online: Core network linked' }
      }));
    };
    const handleOfflineStatus = () => {
      setIsOnline(false);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'error', message: 'You are offline. Proximity mesh active.' }
      }));
    };
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    // 7. Splash screen dismiss timer (Instruction 2)
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

    // 8. Global acoustic clicks
    const handleGlobalClick = (e) => {
      const target = e.target.closest('button, a, [role="button"]');
      if (target && !target.disabled) {
        AudioEngine.play('tap');
        Haptic.tap();
      }
    };
    document.addEventListener('click', handleGlobalClick);

    return () => {
      safeCall(cleanup, "Interval Cleanup");
      window.removeEventListener('show-toast', handleToast);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      document.removeEventListener('click', handleGlobalClick);
      clearTimeout(splashTimer);
    };
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('sharednet_onboarded', 'true');
    setOnboarded(true);
    AudioEngine.play('success');
    Haptic.success();
  };

  return (
    <Router>
      <AppContent 
        onboarded={onboarded}
        setOnboarded={setOnboarded}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        toasts={toasts}
        setToasts={setToasts}
        handleFinishOnboarding={handleFinishOnboarding}
        showSplash={showSplash}
        isOnline={isOnline}
      />
    </Router>
  );
}

function AppContent({
  onboarded,
  setOnboarded,
  currentSlide,
  setCurrentSlide,
  toasts,
  setToasts,
  handleFinishOnboarding,
  showSplash,
  isOnline
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [transitionClass, setTransitionClass] = useState('app-launch-anim');
  const [showHelpers, setShowHelpers] = useState(false);

  // Trigger page transition scaling animations on route changes (Instruction 2)
  useEffect(() => {
    setTransitionClass('screen--exit');
    const timer1 = setTimeout(() => {
      setTransitionClass('screen--enter');
    }, 150);
    const timer2 = setTimeout(() => {
      setTransitionClass('');
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  // Keyboard script helper shortcuts
  useEffect(() => {
    let keyHintShown = localStorage.getItem('key_hint_shown') === 'true';

    const handleKeyDown = (e) => {
      // Shortcut key indicators hint
      if (!keyHintShown && (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || ['s','n','e'].includes(e.key.toLowerCase()))) {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'info', message: "Pro tip: Press 'S' for SOS, 'N' for Network, 'E' for Inbox" }
        }));
        localStorage.setItem('key_hint_shown', 'true');
        keyHintShown = true;
      }

      // Bypass when typing in form inputs
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      // Standard single keys: N (Network), E (Feed), S (SOS)
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        AudioEngine.play('warning');
        Haptic.warning();
        if (confirm("🚨 WARNING: Trigger emergency SOS distress beacon?")) {
          window.dispatchEvent(new CustomEvent('trigger-sos'));
        }
      } else if (key === 'n') {
        e.preventDefault();
        AudioEngine.play('tap');
        navigate('/pulse');
      } else if (key === 'e') {
        e.preventDefault();
        AudioEngine.play('tap');
        navigate('/inbox');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="app-container flex flex-col min-h-screen">
      
      {/* ── OFFLINE STATUS BANNER (Instruction 2) ── */}
      {!isOnline && (
        <div 
          className="offline-banner bg-[#FF9500] text-black text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center shrink-0 z-[9999]" 
          style={{ height: '32px', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
        >
          <i className="ph-bold ph-plugs-warning mr-1.5" />
          You are offline • Proximity Mesh Active
        </div>
      )}

      {/* Demo Mode banner removed */}

      <div className="noise-overlay" />
      <Navbar />
      <SOSButtonFlow />

      {/* ── TOAST NOTIFICATIONS DRAWER ── */}
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

            const handleMouseEnter = () => {
              if (toast.timeoutId) clearTimeout(toast.timeoutId);
            };

            const handleMouseLeave = () => {
              const newTimeout = setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }, 2000);
              toast.timeoutId = newTimeout;
            };

            return (
              <motion.div
                key={toast.id}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0, x: 20 }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`p-4 border-l-4 rounded-lg shadow-2xl flex items-center justify-between gap-3 pointer-events-auto border border-slate-800/80 ${colors[toast.type] || colors.info}`}
              >
                <div className="flex items-center gap-3">
                  {Icons[toast.type] || Icons.info}
                  <span className="text-white text-xs font-bold">{toast.message}</span>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-500 hover:text-white p-0.5"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── MAIN ROUTER SCREEN OVERLAY ── */}
      <main className={`ui-overlay flex-1 pb-36 ${transitionClass}`}>
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/"            element={<Home />} />
            <Route path="/home"        element={<Home />} />
            <Route path="/forum"       element={<Forum />} />
            <Route path="/sos-book"    element={<EmergencyContacts />} />
            <Route path="/evidence"    element={<EvidenceCapture />} />
            <Route path="/contacts"    element={<Contacts />} />
            <Route path="/intel"       element={<IntelDrop />} />
            <Route path="/share"       element={<OfflineShare />} />
            <Route path="/squads"      element={<Squads />} />
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

      {/* Demo Helpers Console removed */}

      {/* ── FIRST-TIME ONBOARDING FLOW OVERLAY ── */}
      {!onboarded && (
        <div className="onboarding fixed inset-0 z-[100000] bg-[#0A0A0F] flex flex-col justify-between p-6">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at bottom, rgba(10,132,255,0.06) 0%, transparent 65%)' }} />

          <div className="flex justify-end z-10">
            <button 
              onClick={handleFinishOnboarding}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider py-2 px-4"
            >
              Skip
            </button>
          </div>

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

          <div className="space-y-6 max-w-sm w-full mx-auto z-10 pb-6">
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

            <div className="space-y-2">
              {currentSlide < 2 ? (
                <button
                  onClick={() => {
                    setCurrentSlide(prev => prev + 1);
                    AudioEngine.play('tap');
                    Haptic.tap();
                  }}
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

      {/* ── SPLASH SCREEN LAYOUT (Instruction 2) ── */}
      {showSplash && (
        <div className="fixed inset-0 bg-[#0A0A0F] z-[999999] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#0A84FF]/10 border border-[#0A84FF]/20 flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.2)]">
            <i className="ph-fill ph-shield-check text-[#0A84FF] animate-pulse" style={{ fontSize: '32px' }} />
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">SharedNet</h1>
        </div>
      )}

    </div>
  );
}

export default App;
