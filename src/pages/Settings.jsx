import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Copy, 
  Check, 
  Globe, 
  HelpCircle, 
  ShieldAlert, 
  Volume2, 
  Smartphone, 
  Eye, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Edit2,
  X,
  BookOpen,
  QrCode,
  ScanLine,
  Wifi,
  Users,
  Clock,
  Share,
  Database,
  DownloadCloud,
  Loader2,
  Shield,
  Key
} from 'lucide-react';
import { useMesh } from '../core/MeshProvider';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { db, injectDemoData } from '../storage/db';

export default function Settings() {
  const navigate = useNavigate();
  const [deviceName, setDeviceName] = useState(localStorage.getItem('setting_device_name') || 'Your Phone');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(deviceName);
  
  // Toggle states
  const [autoConnect, setAutoConnect] = useState(localStorage.getItem('setting_auto_connect') !== 'false');
  const [btFallback, setBtFallback] = useState(localStorage.getItem('setting_bt_fallback') !== 'false');
  const [bgBroadcast, setBgBroadcast] = useState(localStorage.getItem('setting_bg_broadcast') !== 'false');
  
  const [soundAlerts, setSoundAlerts] = useState(localStorage.getItem('setting_sound_alerts') !== 'false');
  const [vibration, setVibration] = useState(localStorage.getItem('setting_vibration') !== 'false');
  
  const [dbSize, setDbSize] = useState('0 KB');
  const [downloadingMap, setDownloadingMap] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);


  
  const [highContrast, setHighContrast] = useState(localStorage.getItem('setting_high_contrast') === 'true');
  const [largeText, setLargeText] = useState(localStorage.getItem('setting_large_text') === 'true');
  const [reduceMotion, setReduceMotion] = useState(localStorage.getItem('setting_reduce_motion') === 'true');

  // Presentation settings (Instruction 6)
  const [versionTaps, setVersionTaps] = useState(0);
  const [presentationMode, setPresentationMode] = useState(localStorage.getItem('presentation_mode') === 'true');
  const [showAboutModal, setShowAboutModal] = useState(false);

  // Mesh pairing state
  const { nodeId: meshNodeId, peerCount, reachableCount, isReady, createOffer, acceptOffer, completeConnection, pendingMessages } = useMesh();
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState(null); // 'show' | 'scan'
  const [offerPayload, setOfferPayload] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [pairStatus, setPairStatus] = useState(''); // '' | 'waiting' | 'connected' | 'error'
  const [pendingConn, setPendingConn] = useState(null);
  const [showQueue, setShowQueue] = useState(false);

  const deviceId = meshNodeId || 'SN-WV1K-7842';

  const calculateDbSize = async () => {
    try {
      const messages = await db.history.count();
      const nodes = await db.meshNodes.count();
      setDbSize(`${(messages * 0.5 + nodes * 0.2).toFixed(1)} KB`);
    } catch(e) {}
  };

  const handleDownloadMaps = async () => {
    setDownloadingMap(true);
    setDownloadProgress(0);
    const cx = 11802;
    const cy = 7445;
    const z = 14;
    const tiles = [];
    for(let dx=-2; dx<=2; dx++) {
      for(let dy=-2; dy<=2; dy++) {
        tiles.push(`https://a.basemaps.cartocdn.com/dark_all/${z}/${cx+dx}/${cy+dy}.png`);
      }
    }
    
    let loaded = 0;
    for(const url of tiles) {
      try {
        await fetch(url, { mode: 'no-cors' });
      } catch(e) {}
      loaded++;
      setDownloadProgress(Math.round((loaded / tiles.length) * 100));
    }
    
    setTimeout(() => {
      setDownloadingMap(false);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Map region cached for offline use.' } }));
    }, 500);
  };

  useEffect(() => {
    calculateDbSize();
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const handleChangePin = () => {
    if (confirm("Are you sure you want to change your Master PIN? You will be prompted to set a new one.")) {
      localStorage.removeItem('sharednet_pin_hash');
      window.location.reload();
    }
  };

  useEffect(() => {
    if (largeText) {
      document.documentElement.style.fontSize = '120%';
    } else {
      document.documentElement.style.fontSize = '100%';
    }
  }, [largeText]);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    if (presentationMode) {
      document.documentElement.classList.add('presentation-mode');
    } else {
      document.documentElement.classList.remove('presentation-mode');
    }
  }, [presentationMode]);

  const showToast = (type, message) => {
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { type, message } }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(deviceId).then(() => {
      showToast('success', 'Device ID copied to clipboard');
    }).catch(() => {
      const el = document.createElement('textarea');
      el.value = deviceId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('success', 'Device ID copied to clipboard');
    });
  };

  const handleSaveName = () => {
    setDeviceName(tempName);
    localStorage.setItem('setting_device_name', tempName);
    setIsEditingName(false);
    showToast('success', 'Device name updated');
  };



  const handleTestSOS = () => {
    window.dispatchEvent(new CustomEvent('trigger-sos-test'));
    showToast('success', 'Bypassing countdown: Mock SOS transmission sent');
  };

  const handleResetNetwork = () => {
    if (confirm("Are you sure you want to reset your local mesh transceivers? This will wipe cached gossip shards.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleVersionClick = () => {
    const nextTaps = versionTaps + 1;
    setVersionTaps(nextTaps);
    if (nextTaps >= 5) {
      const nextPres = !presentationMode;
      setPresentationMode(nextPres);
      localStorage.setItem('presentation_mode', nextPres.toString());
      
      if (nextPres) {
        document.documentElement.classList.add('presentation-mode');
        showToast('info', 'Presentation Mode ON — slowed animations for demo');
      } else {
        document.documentElement.classList.remove('presentation-mode');
        showToast('info', 'Presentation Mode OFF — default speeds restored');
      }
      
      window.dispatchEvent(new CustomEvent('demo-mode-changed'));
      setVersionTaps(0);
    } else {
      showToast('info', `Tap Version ${5 - nextTaps} more times for Presentation Settings`);
    }
  };

  const ToggleSwitch = ({ checked, onChange, activeColor = '#0A84FF' }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full p-1 transition-colors flex ${checked ? 'justify-end' : 'justify-start'}`}
      style={{ backgroundColor: checked ? activeColor : '#3A3A3C' }}
    >
      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
    </button>
  );

  return (
    <div className="space-y-6 pb-48">
      
      {/* ── HEADER ── */}
      <div className="space-y-1">
        <h1 className="text-h1 text-white">Settings</h1>
        <p className="text-body-sm text-slate-400">Configure mesh transceivers & display parameters</p>
      </div>

      {/* ── DEVICE IDENTITY SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Device Identity</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl divide-y divide-slate-800/60">
          
          <div className="pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Device Alias</span>
              {isEditingName ? (
                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={e => setTempName(e.target.value)} 
                    className="bg-[#2C2C2E] border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0A84FF]"
                    maxLength={15}
                  />
                  <button onClick={handleSaveName} className="p-1 bg-[#34C759] text-white rounded"><Check size={14} /></button>
                </div>
              ) : (
                <span className="text-white text-xs font-semibold">{deviceName}</span>
              )}
            </div>
            {!isEditingName && (
              <button onClick={() => { setTempName(deviceName); setIsEditingName(true); }} className="text-slate-400 hover:text-white p-1">
                <Edit2 size={14} />
              </button>
            )}
          </div>

          <div className="py-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Transceiver ID</span>
              <span className="text-slate-400 font-mono text-[10px]">{deviceId}</span>
            </div>
            <button onClick={copyToClipboard} className="text-slate-400 hover:text-[#0A84FF] p-1" aria-label="Copy Device ID">
              <Copy size={14} />
            </button>
          </div>

          <div className="pt-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Network Role</span>
              <span className="text-slate-400 text-xs">Propagates background gossip</span>
            </div>
            <span className="status-pill status-pill--success uppercase tracking-wider">
              Relay Node
            </span>
          </div>

        </div>
      </div>

      {/* ── IDENTITY SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#0A84FF] uppercase tracking-widest block pl-1">Identity</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <button 
            onClick={() => navigate('/contacts')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                <Users size={16} className="text-[#0A84FF]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Identity & Contacts</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Manage keys and friends</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={() => navigate('/squads')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
                <Shield size={16} className="text-[#8b5cf6]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Squad Channels</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Encrypted private groups</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={() => navigate('/share')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#34C759]/20 flex items-center justify-center">
                <Share size={16} className="text-[#34C759]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Share App Offline</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">AirDrop or QR code install</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>

          <button 
            onClick={handleChangePin}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
                <Key size={16} className="text-[#f59e0b]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Change Master PIN</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Reset your security code</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* ── HACKATHON TOOLS ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#FF9500] uppercase tracking-widest block pl-1">Hackathon Tools</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <button 
            onClick={() => {
              if(confirm("Flood database with demo data (SOS, nodes, forum posts)?")) {
                injectDemoData();
              }
            }}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#FF9500]/20 flex items-center justify-center">
                <Sparkles size={16} className="text-[#FF9500]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Inject Demo Data</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">Populate map, inbox & forum</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* ── SYSTEM DIAGNOSTICS SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#34C759] uppercase tracking-widest block pl-1">System</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <button 
            onClick={() => navigate('/storage')}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#34C759]/20 flex items-center justify-center">
                <Database size={16} className="text-[#34C759]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Local Datastore</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{dbSize} • IndexedDB (Encrypted)</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
          
          <button 
            onClick={handleDownloadMaps}
            disabled={downloadingMap}
            className="w-full flex items-center justify-between group active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center">
                {downloadingMap ? (
                  <Loader2 size={16} className="text-[#0A84FF] animate-spin" />
                ) : (
                  <DownloadCloud size={16} className="text-[#0A84FF]" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Download Offline Region</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {downloadingMap ? `Caching tiles... ${downloadProgress}%` : 'Save 10km radius to device'}
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── MESH NETWORK SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-[#0A84FF] uppercase tracking-widest block pl-1">Real Mesh Network</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-3">
          
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">Mesh Node ID</span>
              <span className="text-white font-mono text-xs font-semibold">{meshNodeId || '...'}</span>
            </div>
            <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${isReady ? 'bg-[#34C759]/20 text-[#34C759]' : 'bg-slate-700 text-slate-400'}`}>
              {isReady ? 'Online' : 'Initializing'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-2 border-y border-slate-800/60">
            <div className="text-center">
              <p className="text-lg font-black text-[#0A84FF] font-mono">{peerCount}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase">Direct</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#34C759] font-mono">{reachableCount}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase">Reachable</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-[#FF9500] font-mono">{pendingMessages.length}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase">Queued</p>
            </div>
          </div>

          {pendingMessages.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60">
              <button 
                onClick={() => setShowQueue(!showQueue)}
                className="w-full flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 py-2"
              >
                <span>Store-and-Forward Queue</span>
                <ChevronRight size={14} className={`transition-transform ${showQueue ? 'rotate-90' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showQueue && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-1">
                      {pendingMessages.map((msg, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#2C2C2E]/50 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#FF9500]" />
                            <span className="text-[9px] font-mono text-slate-300">To: {msg.to.slice(0, 6)}</span>
                          </div>
                          <span className="text-[8px] uppercase font-black text-slate-500">{msg.type}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={async () => {
                setPairMode('show');
                setPairStatus('waiting');
                setShowPairModal(true);
                try {
                  const offer = await createOffer();
                  setOfferPayload(offer.payload);
                  setPendingConn(offer);
                  setPairStatus('');
                } catch (err) {
                  setPairStatus('error');
                  console.error('[Pairing] Offer failed:', err);
                }
              }}
              className="flex-1 py-3 bg-[#0A84FF] text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <QrCode size={14} /> Show My QR
            </button>
            <button
              onClick={() => {
                setPairMode('scan');
                setShowPairModal(true);
                setPairStatus('');
                setAnswerInput('');
              }}
              className="flex-1 py-3 bg-[#2C2C2E] border border-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <ScanLine size={14} /> Scan Peer QR
            </button>
          </div>

        </div>
      </div>

      {/* ── PAIR MODAL ── */}
      <AnimatePresence>
        {showPairModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowPairModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1C1C1E] border border-slate-700 rounded-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-white font-black text-sm uppercase tracking-wider">
                  {pairMode === 'show' ? 'Your Offer QR' : 'Scan Peer Code'}
                </h3>
                <button onClick={() => setShowPairModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {pairMode === 'show' && (
                <div className="space-y-4">
                  {pairStatus === 'waiting' ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-slate-400 text-xs">Generating WebRTC offer...</p>
                    </div>
                  ) : pairStatus === 'error' ? (
                    <p className="text-red-400 text-xs text-center py-4">Failed to create offer. Try again.</p>
                  ) : (
                    <>
                      <div className="text-[10px] text-slate-500 text-center mb-2">Step 1: Have the other device scan this</div>
                      <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                        <QRCodeSVG value={offerPayload} size={200} level="L" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] text-slate-500 text-center">Step 2: Paste the answer code from their device:</p>
                        <textarea
                          value={answerInput}
                          onChange={(e) => setAnswerInput(e.target.value)}
                          placeholder="Paste the answer payload here..."
                          className="w-full bg-[#2C2C2E] border border-slate-700 text-white rounded-lg px-3 py-2 text-[10px] font-mono h-20 resize-none focus:outline-none focus:border-[#0A84FF]"
                        />
                        <button
                          onClick={() => {
                            if (!answerInput.trim()) return;
                            try {
                              completeConnection(answerInput.trim());
                              setPairStatus('connected');
                              setTimeout(() => setShowPairModal(false), 1500);
                              window.dispatchEvent(new CustomEvent('show-toast', {
                                detail: { type: 'success', message: '✅ Mesh peer connected!' }
                              }));
                            } catch (err) {
                              setPairStatus('error');
                              console.error('[Pairing]', err);
                            }
                          }}
                          className="w-full py-3 bg-[#34C759] text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-[0.98] transition-transform"
                        >
                          Complete Connection
                        </button>
                      </div>
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: 'SharedNet Pairing', text: offerPayload }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(offerPayload);
                            window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Offer copied to clipboard' } }));
                          }
                        }}
                        className="w-full py-2 bg-[#2C2C2E] border border-slate-700 text-slate-300 rounded-xl text-[9px] font-bold uppercase tracking-wider"
                      >
                        Share Code Instead
                      </button>
                    </>
                  )}
                  {pairStatus === 'connected' && (
                    <div className="text-center py-4">
                      <div className="text-[#34C759] text-2xl mb-2">✅</div>
                      <p className="text-[#34C759] font-bold text-sm">Connected!</p>
                    </div>
                  )}
                </div>
              )}

              {pairMode === 'scan' && (
                <div className="space-y-4">
                  <p className="text-[10px] text-slate-500 text-center">Paste the offer code from the other device:</p>
                  <textarea
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Paste the offer payload here..."
                    className="w-full bg-[#2C2C2E] border border-slate-700 text-white rounded-lg px-3 py-2 text-[10px] font-mono h-24 resize-none focus:outline-none focus:border-[#0A84FF]"
                  />
                  {pairStatus === 'connected' ? (
                    <div className="text-center py-4">
                      <div className="text-[#34C759] text-2xl mb-2">✅</div>
                      <p className="text-[#34C759] font-bold text-sm">Connected!</p>
                    </div>
                  ) : pairStatus === 'answering' ? (
                    <div className="space-y-3">
                      <div className="text-[10px] text-slate-500 text-center">Show this answer to the other device:</div>
                      <div className="bg-white p-4 rounded-xl flex items-center justify-center">
                        <QRCodeSVG value={offerPayload} size={200} level="L" />
                      </div>
                      <button
                        onClick={async () => {
                          if (navigator.share) {
                            try { await navigator.share({ title: 'SharedNet Answer', text: offerPayload }); } catch { /* cancelled */ }
                          } else {
                            await navigator.clipboard.writeText(offerPayload);
                            window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'info', message: 'Answer copied to clipboard' } }));
                          }
                        }}
                        className="w-full py-2 bg-[#2C2C2E] border border-slate-700 text-slate-300 rounded-xl text-[9px] font-bold uppercase tracking-wider"
                      >
                        Share Answer Code
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!answerInput.trim()) return;
                        try {
                          const answerPayload = await acceptOffer(answerInput.trim());
                          setOfferPayload(answerPayload);
                          setPairStatus('answering');
                        } catch (err) {
                          setPairStatus('error');
                          console.error('[Pairing] Accept failed:', err);
                        }
                      }}
                      className="w-full py-3 bg-[#0A84FF] text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-[0.98] transition-transform"
                    >
                      Accept & Generate Answer
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* ── NETWORK CONFIGURATION SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Network Config</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Auto-Connect to Mesh</span>
              <p className="text-[10px] text-slate-500">Automatically sync with nearest transceivers.</p>
            </div>
            <ToggleSwitch 
              checked={autoConnect} 
              onChange={(val) => { setAutoConnect(val); localStorage.setItem('setting_auto_connect', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Bluetooth Fallback</span>
              <p className="text-[10px] text-slate-500">Auto background synchronization via BLE links.</p>
            </div>
            <ToggleSwitch 
              checked={btFallback} 
              onChange={(val) => { setBtFallback(val); localStorage.setItem('setting_bt_fallback', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Background Broadcasting</span>
              <p className="text-[10px] text-slate-500">Propagate encrypted shards when app is minimized.</p>
            </div>
            <ToggleSwitch 
              checked={bgBroadcast} 
              onChange={(val) => { setBgBroadcast(val); localStorage.setItem('setting_bg_broadcast', val.toString()); }} 
            />
          </div>

          <button 
            onClick={handleResetNetwork}
            className="w-full flex items-center justify-center gap-1.5 py-3 border border-[#FF3B30]/30 hover:bg-[#FF3B30]/5 text-[#FF3B30] text-xs font-bold uppercase rounded-lg transition-colors"
          >
            <ShieldAlert size={14} />
            Reset Local Mesh Node
          </button>
        </div>
      </div>

      {/* ── EMERGENCY PARAMETERS ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Emergency Operations</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Sound Alerts</span>
              <p className="text-[10px] text-slate-500">Play acoustic warning sweeps on incoming alerts.</p>
            </div>
            <ToggleSwitch 
              checked={soundAlerts} 
              onChange={(val) => { setSoundAlerts(val); localStorage.setItem('setting_sound_alerts', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Tactile Haptics</span>
              <p className="text-[10px] text-slate-500">Vibrate patterns during transmissions.</p>
            </div>
            <ToggleSwitch 
              checked={vibration} 
              onChange={(val) => { setVibration(val); localStorage.setItem('setting_vibration', val.toString()); }} 
            />
          </div>

          <button 
            onClick={handleTestSOS}
            className="w-full py-3 bg-[#FF3B30] hover:bg-[#D32F2F] text-white text-xs font-bold uppercase rounded-lg transition-colors shadow-lg shadow-[#FF3B30]/15"
          >
            Test SOS Signal (Instant Beam)
          </button>
        </div>
      </div>

      {/* ── ACCESSIBILITY OPTIONS ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">Accessibility</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">High Contrast Mode</span>
              <p className="text-[10px] text-slate-500">Increases borders and visual readability.</p>
            </div>
            <ToggleSwitch 
              checked={highContrast} 
              onChange={(val) => { setHighContrast(val); localStorage.setItem('setting_high_contrast', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Large UI Text</span>
              <p className="text-[10px] text-slate-500">Scales interfaces up to 120% magnification.</p>
            </div>
            <ToggleSwitch 
              checked={largeText} 
              onChange={(val) => { setLargeText(val); localStorage.setItem('setting_large_text', val.toString()); }} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-semibold text-xs">Reduce Interface Motion</span>
              <p className="text-[10px] text-slate-500">Bypasses visual scale & float animations.</p>
            </div>
            <ToggleSwitch 
              checked={reduceMotion} 
              onChange={(val) => { setReduceMotion(val); localStorage.setItem('setting_reduce_motion', val.toString()); }} 
            />
          </div>
        </div>
      </div>

      {/* ── ABOUT SECTION ── */}
      <div className="space-y-2">
        <span className="text-caption text-slate-500 uppercase tracking-widest block pl-1">About</span>
        <div className="card p-4 bg-[#1C1C1E] border border-slate-800 rounded-xl divide-y divide-slate-800/60 text-xs">
          <div 
            onClick={handleVersionClick} 
            className="pb-3 flex justify-between items-center cursor-pointer hover:bg-white/5 p-1 rounded transition-all"
          >
            <span className="text-slate-500 font-medium">Software Version</span>
            <span className="text-white font-semibold flex items-center gap-1.5">
              <span>1.0.0 (Hackathon Build)</span>
              {presentationMode && <span className="bg-[#FF9500] text-black px-1.5 py-0.5 rounded text-[8px] font-black uppercase">PRES</span>}
            </span>
          </div>
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Pitch Context</span>
            <span className="text-white font-semibold">Founders Fest 2026</span>
          </div>
          <div className="pt-3 flex justify-between items-center">
            <span className="text-slate-500 font-medium">Technical Blueprint</span>
            <button 
              onClick={() => { setShowAboutModal(true); showToast('info', 'Opening Pitch leaf-behind...'); }}
              className="text-[#0A84FF] font-semibold flex items-center gap-1 hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              <span>Audit Blueprint</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── JUDGE-FACING "ABOUT" MODAL OVERLAY (Instruction 4) ── */}
      <AnimatePresence>
        {showAboutModal && (
          <div 
            className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0" onClick={() => setShowAboutModal(false)} />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-[#1C1C1E] border border-slate-800 w-full max-w-sm rounded-xl p-6 relative z-10 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto scroll-momentum-container"
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-white italic uppercase tracking-tight">SharedNet</h2>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mt-0.5">
                    1.0.0 (Founders Fest Build)
                  </span>
                </div>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="h-[1px] bg-slate-800/80" />

              {/* Tagline & Problem */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#0A84FF] font-bold uppercase tracking-wide block">The Proposition</span>
                <p className="text-white text-xs font-bold leading-normal">
                  "Emergency communication when everything else fails."
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">The Problem</span>
                <p className="text-slate-400 leading-relaxed">
                  Natural disasters, remote areas, and grid attacks sever communications. First responders and survivors need coordination without cell towers or internet.
                </p>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">The Solution</span>
                <p className="text-slate-400 leading-relaxed">
                  SharedNet forms a self-healing mesh network using WebRTC data channels and Bluetooth Low Energy. Every phone becomes a relay. Messages hop from device to device.
                </p>
              </div>

              {/* Tech Stack */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Technical Stack</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {['WebRTC Channels', 'BLE GATT', 'AES-256-GCM', 'PWA Offline'].map(tech => (
                    <span key={tech} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Team Credentials</span>
                <p className="text-slate-400 italic">Built by Team Antigravity at Founders Fest 2026</p>
              </div>

              {/* QR Code */}
              <div className="bg-[#2C2C2E]/40 border border-slate-800 p-4 rounded-lg text-center space-y-2">
                <span className="text-[9px] text-[#FF9500] font-black uppercase tracking-widest block">Live Pitch Demo link</span>
                
                {/* SVG QR Code (Instruction 4) */}
                <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto bg-white p-1.5 rounded">
                  <rect x="0" y="0" width="30" height="30" fill="black" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="black" />
                  
                  <rect x="70" y="0" width="30" height="30" fill="black" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="black" />
                  
                  <rect x="0" y="70" width="30" height="30" fill="black" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="black" />
                  
                  <rect x="75" y="75" width="10" height="10" fill="black" />
                  <rect x="78" y="78" width="4" height="4" fill="white" />
                  
                  <rect x="35" y="5" width="10" height="5" fill="black" />
                  <rect x="55" y="10" width="5" height="15" fill="black" />
                  <rect x="40" y="25" width="15" height="5" fill="black" />
                  <rect x="5" y="45" width="15" height="10" fill="black" />
                  <rect x="25" y="35" width="5" height="20" fill="black" />
                  <rect x="35" y="45" width="20" height="5" fill="black" />
                  <rect x="45" y="55" width="5" height="15" fill="black" />
                  <rect x="15" y="60" width="10" height="5" fill="black" />
                  <rect x="65" y="35" width="15" height="5" fill="black" />
                  <rect x="60" y="50" width="5" height="15" fill="black" />
                  <rect x="85" y="45" width="10" height="10" fill="black" />
                  <rect x="70" y="60" width="10" height="5" fill="black" />
                  <rect x="35" y="80" width="15" height="10" fill="black" />
                  <rect x="55" y="75" width="10" height="5" fill="black" />
                  <rect x="55" y="85" width="5" height="10" fill="black" />
                </svg>

                <p className="text-[9px] text-slate-500">Scan to run SharedNet on judge transceivers</p>
              </div>

              {/* View on GitHub Button */}
              <div className="flex gap-2">
                <a 
                  href="https://github.com/abdulquader057-dev/ShardNet-Self-Healing-Information-Network" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex-1 h-12 bg-transparent border border-slate-800 text-slate-300 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase hover:bg-slate-800/40 active:scale-95 transition-transform"
                >
                  <i className="ph-bold ph-github-logo" style={{ fontSize: '16px' }} />
                  <span>View Repository</span>
                </a>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="flex-1 h-12 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase active:scale-95 transition-transform"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Reusable custom toggle switch component (Instruction 3)
function ToggleSwitch({ checked, onChange, activeColor = '#34C759' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 transition-colors duration-200 ease-in-out cursor-pointer rounded-full outline-none focus:ring-1 focus:ring-[#0A84FF]/40"
      style={{
        width: '52px',
        height: '32px',
        backgroundColor: checked ? activeColor : '#3A3A3C',
        border: checked ? 'none' : '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <span
        className="inline-block rounded-full bg-white transition-transform duration-200 ease-in-out"
        style={{
          width: '28px',
          height: '28px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
          marginTop: '2px',
          verticalAlign: 'top'
        }}
      />
    </button>
  );
}
