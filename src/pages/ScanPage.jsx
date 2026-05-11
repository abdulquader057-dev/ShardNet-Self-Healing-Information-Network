import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, AlertCircle, Info, Zap, Bluetooth, Trash2, Radio, Volume2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { parseShardQR } from '../utils/qr';
import { saveShard, getShardsByMessageId, getAllShards, saveMessage, db } from '../storage/db';
import { validateShard, reconstructMessage } from '../core/sharding';
import { events, MESH_EVENTS } from '../core/events';
import { getGoogleMapsUrl } from '../utils/geo';
import { addWitnessProof, getConsensusStatus } from '../core/consensusEngine';
import { MapPin, Globe, Users } from 'lucide-react';
import { safeInit, DEMO_MODE } from '../core/stability';

// ─── Message Reconstructor Reveal Card ────────────────────────────────────────
const MessageReconstructor = ({ result, onClear, onRebroadcast }) => {
  const msg = result?.message || '';
  const isEmergency =
    msg.toLowerCase().includes('help') ||
    msg.toLowerCase().includes('emergency');

  const cardBg = isEmergency ? 'bg-red-600' : 'bg-surface';
  const textColor = isEmergency ? 'text-white' : 'text-white';
  const borderColor = isEmergency ? 'border-red-400' : 'border-secondary';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      className="w-full"
    >
      {isEmergency && (
        <div className="fixed inset-0 pointer-events-none z-50 border-4 border-red-500 animate-pulse" />
      )}

      <div className={`${cardBg} border-4 ${borderColor} rounded-2xl shadow-2xl overflow-hidden`}>
        <div className={`flex items-center justify-between px-5 py-3 ${isEmergency ? 'bg-red-700' : 'bg-secondary/20'}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📡</span>
            <span className={`font-black uppercase tracking-wider text-sm ${isEmergency ? 'text-red-100' : 'text-secondary'}`}>
              {isEmergency ? '🚨 EMERGENCY BROADCAST' : '✅ MESSAGE UNLOCKED'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-black px-2 py-1 rounded-full border border-white/20 ${isEmergency ? 'bg-red-500 text-white' : 'bg-primary text-white'}`}>
              {result.category || 'Info'}
            </span>
            {getConsensusStatus(result) === 'verified' && (
              <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <Users size={8} /> VERIFIED
              </span>
            )}
          </div>
        </div>

        <div className={`px-6 pt-8 pb-6 ${isEmergency ? 'bg-red-600' : 'bg-background'}`}>
          {msg ? (
            <div className="space-y-6">
              <p className={`text-4xl font-extrabold text-center uppercase leading-tight tracking-tight ${isEmergency ? 'text-white' : 'text-white'}`}>
                {msg.startsWith('AUDIO:') ? '🔊 VOICE SIGNAL UNLOCKED' : `"${msg}"`}
              </p>
              
              {msg.startsWith('AUDIO:') && (
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => {
                      const audio = new Audio(msg.replace('AUDIO:', ''));
                      audio.play();
                    }}
                    className={`p-8 rounded-full border-4 animate-pulse transition-all ${
                      isEmergency ? 'bg-red-700 border-red-500 text-white' : 'bg-primary/20 border-primary text-primary'
                    }`}
                  >
                    <Volume2 size={48} />
                  </button>
                  <span className={`text-xs font-black uppercase tracking-[0.2em] ${isEmergency ? 'text-red-200' : 'text-slate-500'}`}>
                    Tap to play intelligence
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-2xl font-extrabold text-center text-yellow-400 uppercase">
              ⚠️ Message text could not be decrypted. Try rescanning.
            </p>
          )}
        </div>

        <div className={`px-6 py-4 flex flex-col gap-2 ${isEmergency ? 'bg-red-700/60' : 'bg-white/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={18} className={isEmergency ? 'text-red-100' : 'text-primary'} />
              <span className={`text-sm font-black uppercase ${isEmergency ? 'text-red-100' : 'text-slate-300'}`}>
                {result.location || 'Unknown Location'}
              </span>
            </div>
            <span className={`text-[9px] font-mono ${isEmergency ? 'text-red-200' : 'text-slate-500'}`}>
              Node: {result.originNodeId || 'unknown'}
            </span>
          </div>
          {result.geo && (
            <a 
              href={getGoogleMapsUrl(result.geo.lat, result.geo.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                isEmergency 
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                  : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
              }`}
            >
              <Globe size={12} /> View on Mesh Map
            </a>
          )}
        </div>

        <div className={`px-5 py-5 space-y-3 ${isEmergency ? 'bg-red-800/40' : 'bg-surface'}`}>
          <button
            onClick={onRebroadcast}
            className="w-full bg-primary hover:bg-primary/80 py-4 rounded-xl font-black text-white uppercase tracking-[0.15em] text-sm transition shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            <Radio size={18} />
            ACKNOWLEDGE & REBROADCAST
          </button>
          <button
            onClick={onClear}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition border ${
              isEmergency
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                : 'bg-danger/10 hover:bg-danger/20 text-danger border-danger/20'
            }`}
          >
            <Trash2 size={14} />
            CLEAR MESSAGE (SECURE WIPE)
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Shard Status Card ─────────────────────────────────────────────────────────

const ShardStatusCard = ({ scanResult, onScanNext }) => {
  const { shard, isComplete } = scanResult;
  const { shardIndex, totalShards, category, location, expiry } = shard;
  const timeLeft = Math.max(0, Math.round((expiry - Date.now()) / (1000 * 60 * 60)));
  const isEmergency = category === 'Emergency';
  const shardsHave = scanResult.shardsHave || shardIndex + 1;
  const shardsNeed = totalShards - shardsHave;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full"
    >
      <div
        className={`bg-surface border-l-4 ${
          isEmergency ? 'border-danger' : 'border-primary'
        } p-4 rounded-lg shadow-lg`}
      >
        <div className="flex justify-between items-center mb-3">
          <span
            className={`${
              isEmergency ? 'bg-danger' : 'bg-primary'
            } text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}
          >
            {category} Alert
          </span>
          <span className="text-gray-400 text-xs">📍 {location.toUpperCase()}</span>
        </div>

        <div className="mb-6 text-center py-4">
          {isComplete ? (
            <p className="text-secondary text-lg font-bold">✅ Message Fully Collected</p>
          ) : (
            <>
              <p className="text-warning text-xl font-extrabold mb-1">
                Waiting for Shard {shardsHave + 1}/{totalShards}…
              </p>
              <p className="text-gray-400 text-sm">
                Scan to unlock help message.
              </p>
            </>
          )}
        </div>

        <div className="w-full bg-gray-800 h-3 rounded-full mb-5">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-700"
            style={{ width: `${(shardsHave / totalShards) * 100}%` }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-warning text-xs font-medium">Expires in {timeLeft}h</span>
          <button
            onClick={onScanNext}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm transition"
          >
            {isComplete ? 'Decrypting…' : `Scan Shard ${shardsHave + 1}`}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main ScanPage ─────────────────────────────────────────────────────────────
const ScanPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [showManual, setShowManual] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      await handleResult(decodedText);
    } catch(err) {
      setError("Gallery Extract Failed: No valid QR code found in image.");
    }
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const unsubComplete = events.listen(MESH_EVENTS.MESSAGE_COMPLETE, (msg) => {
      setScanResult({ type: 'message', result: msg });
      setIsDecrypting(false);
      setError(null);
    });

    const checkVault = async () => {
      safeInit("Vault Check", async () => {
        const messages = await db.messages.toArray();
        if (messages.length > 0) {
          setScanResult({ type: 'message', result: messages[messages.length - 1] });
        }
      });
    };
    checkVault();
    return () => unsubComplete();
  }, []);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam);
        handleResult(decoded);
        setSearchParams({});
      } catch (e) {
        console.error("Deep link parse failed", e);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      safeInit("QR Scanner Engine", () => {
        const scanner = new Html5QrcodeScanner('reader', { 
          fps: 5, 
          qrbox: { width: 250, height: 250 },
          videoConstraints: { facingMode: facingMode }
        });
        scanner.render(onScanSuccess, () => {});
        scannerRef.current = scanner;
      });
    }
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.warn("Scanner cleanup failed", e);
        }
        scannerRef.current = null;
      }
    };
  }, [isScanning, facingMode]);

  async function onScanSuccess(decodedText) {
    if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
        setIsScanning(false);
    }
    await handleResult(decodedText);
  }

  async function handleResult(decodedText) {
    setError(null);
    try {
      const result = parseShardQR(decodedText);
      if (!result) {
        setError('INVALID SIGNAL: Protocol mismatch.');
        return;
      }

      if (result.type === 'bundle') {
        let newCount = 0, dupCount = 0, errCount = 0;
        for (const shard of result.shards) {
          const v = validateShard(shard);
          if (!v.valid) { errCount++; continue; }
          const existing = await db.shards.get(shard.id);
          if (existing) { dupCount++; continue; }
          await saveShard(shard);
          newCount++;
        }
        setScanResult({ type: 'bundle', newCount, dupCount, errCount });

        if (result.proofs && Array.isArray(result.proofs)) {
          for (const proof of result.proofs) {
            await addWitnessProof(proof.mId, proof.h, proof.n);
          }
        }
      } else {
        const shard = result.shard || result;
        const v = validateShard(shard);
        if (!v.valid) {
          setError(`SIGNAL CORRUPTED: ${v.error}`);
          return;
        }

        const existing = await db.shards.get(shard.id);
        if (existing && !DEMO_MODE) {
          setError('SIGNAL REDUNDANT: Fragment already in Vault.');
        }

        await saveShard(shard);
        
        const allLocal = await getShardsByMessageId(shard.messageId);
        const isComplete = allLocal.length >= shard.totalShards;
        
        if (isComplete) {
          setIsDecrypting(true);
          const fullMessage = await reconstructMessage(allLocal);
          if (fullMessage) {
            const finalMsg = await saveMessage({
              messageId: shard.messageId,
              message: fullMessage,
              category: shard.category,
              location: shard.location,
              geo: shard.geo,
              originNodeId: shard.originNodeId,
              reconstructedAt: Date.now(),
              priority: shard.priority,
              trustScore: allLocal.reduce((acc, s) => acc + s.trustScore, 0)
            });
            setScanResult({ type: 'message', result: finalMsg });
            setIsDecrypting(false);
          } else {
            setError('DECRYPTION FAILED: Signal integrity compromised.');
            setIsDecrypting(false);
          }
        } else {
          setScanResult({ 
            type: 'shard', 
            shard, 
            isComplete,
            shardsHave: allLocal.length,
            totalShards: shard.totalShards 
          });
        }
      }
    } catch (err) {
      console.error('Ingest failed:', err);
      setError('DECODING FAILED: Signal integrity compromised.');
    }
  }

  const handleManualIngest = () => {
    if (!manualCode.trim()) return;
    handleResult(manualCode.trim());
    setManualCode('');
    setShowManual(false);
  };

  const handleClear = async () => {
    if (scanResult?.type === 'message') {
      try {
        await db.messages.delete(scanResult.result.messageId);
        const shards = await getShardsByMessageId(scanResult.result.messageId);
        for (const s of shards) await db.shards.delete(s.id);
      } catch (e) { console.warn(e); }
    }
    setScanResult(null);
    setError(null);
  };

  const handleRebroadcast = () => {
    navigate('/');
  };

  const handleScanNext = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  const simulateDemoShard = () => {
    if (!DEMO_MODE) return;
    // Simulate a medical emergency shard
    const demoShard = "SHARD:v1:mId_demo:1:2:Medical:NewDelhi:3:1777395000000:node_X:28.61:77.21:ENCRYPTED_DEMO_DATA";
    handleResult(demoShard);
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-accent/20 p-3 rounded-2xl text-accent shadow-[0_0_15px_rgba(139,92,246,0.2)]">
          <Zap size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="heading-lg text-white italic uppercase tracking-tighter">Signal Intercept</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protocol: Mesh-Gossip v4.0</p>
        </div>
      </div>

      <div className="bento-grid">
        <div className="bento-col-12">
          <div className="bento-card min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden border-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-20" />
            
            {!isScanning && !scanResult && !isDecrypting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10 py-12"
              >
                <div className="relative mx-auto w-40 h-40">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-accent rounded-full blur-3xl"
                  />
                  <div className="relative w-full h-full glass-premium rounded-full flex items-center justify-center text-accent border-accent/20">
                    <Camera size={56} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white italic uppercase">Initialize Scanner</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Point camera at a peer node's broadcast signature to intercept signal fragments.
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap justify-center px-6">
                  <button
                    onClick={() => setIsScanning(true)}
                    className="btn-premium btn-primary flex-1 min-w-[220px] !py-5 !text-sm"
                  >
                    <Camera size={20} />
                    START INTERCEPT
                  </button>
                  
                  <div className="flex gap-3 w-full justify-center">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-premium btn-outline !p-5"
                      title="Import from Vault"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <button
                      onClick={() => setShowManual(!showManual)}
                      className={`btn-premium btn-outline !p-5 ${showManual ? 'bg-accent/20 border-accent/40 text-accent' : ''}`}
                      title="Manual Ingestion"
                    >
                      <Radio size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {isScanning && (
              <div className="w-full h-full flex flex-col gap-6 p-2">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Intercept</span>
                  </div>
                  <button 
                    onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
                    className="btn-premium btn-outline !py-2 !px-4 !text-[9px]"
                  >
                    <RefreshCw size={12} /> FLIP LENS
                  </button>
                </div>
                
                <div className="relative w-full aspect-square max-w-[400px] mx-auto overflow-hidden rounded-[2.5rem] border-2 border-white/10 shadow-2xl">
                  <div className="scan-line" />
                  <style>{`
                    #reader { border: none !important; background: transparent !important; }
                    #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
                  `}</style>
                  <div id="reader" className="w-full h-full" />
                </div>
                
                <button
                  onClick={() => setIsScanning(false)}
                  className="btn-premium btn-outline !text-[10px] !py-4 opacity-60 hover:opacity-100"
                >
                  ABORT SCAN
                </button>
              </div>
            )}

            {isDecrypting && (
              <div className="py-20 flex flex-col items-center gap-8">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-4 border-white/5 border-t-primary"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock size={24} className="text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-primary font-black uppercase tracking-[0.3em] text-sm">Decrypting Payload</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Checking Signal Integrity...</p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {scanResult?.type === 'shard' && !isDecrypting && (
                <ShardStatusCard
                  key="shard-card"
                  scanResult={scanResult}
                  onScanNext={handleScanNext}
                />
              )}
              {scanResult?.type === 'message' && (
                <MessageReconstructor
                  key="message-card"
                  result={scanResult.result}
                  onClear={handleClear}
                  onRebroadcast={handleRebroadcast}
                />
              )}
              {scanResult?.type === 'bundle' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md p-8 glass-premium rounded-[2rem] border-secondary/20 flex flex-col items-center gap-6 text-center"
                >
                  <div className="bg-secondary/10 p-5 rounded-3xl text-secondary shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <Check size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white italic uppercase">Bundle Sync Success</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-loose">
                      {scanResult.newCount} fragments ingested <br />
                      {scanResult.dupCount} signals verified <br />
                      {scanResult.errCount > 0 && <span className="text-danger">{scanResult.errCount} failures purged</span>}
                    </p>
                  </div>
                  <button onClick={handleScanNext} className="btn-premium btn-primary w-full">CONTINUE SCAN</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bento-col-12">
           <div className="bento-card flex-row items-start gap-6 border-white/5 bg-white/[0.02]">
              <div className="p-4 bg-white/5 rounded-2xl text-slate-400">
                <Info size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Protocol Intelligence</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  SharedNet utilizes <span className="text-slate-300">Shamir's Secret Sharing</span> to distribute encrypted payloads across the mesh. 
                  Intercepting enough fragments allows local reconstruction without internet access.
                </p>
              </div>
           </div>
        </div>
      </div>
      <div id="reader-hidden" style={{ display: 'none' }}></div>
    </div>
  );
};

export default ScanPage;
