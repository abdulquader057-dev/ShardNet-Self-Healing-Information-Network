import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldAlert, XCircle } from 'lucide-react';
import { clearAllData } from '../storage/db';
import { Haptic } from '../core/feedback';

// Simple SHA-256 hashing for the PIN
async function hashPIN(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function PINLock({ children }) {
  const [pinHash, setPinHash] = useState(localStorage.getItem('sharednet_pin_hash'));
  const [isLocked, setIsLocked] = useState(!!localStorage.getItem('sharednet_pin_hash'));
  const [mode, setMode] = useState(pinHash ? 'verify' : 'setup'); // 'setup' | 'confirm' | 'verify'
  
  const [inputPin, setInputPin] = useState('');
  const [setupPin, setSetupPin] = useState('');
  
  const [error, setError] = useState('');
  const [lockoutTime, setLockoutTime] = useState(0);

  // Check lockout on mount
  useEffect(() => {
    const checkLockout = () => {
      const unlockTime = parseInt(localStorage.getItem('sharednet_lockout_until') || '0', 10);
      const now = Date.now();
      if (unlockTime > now) {
        setLockoutTime(Math.ceil((unlockTime - now) / 1000));
      } else {
        setLockoutTime(0);
      }
    };
    
    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = async (num) => {
    if (lockoutTime > 0) {
      Haptic.error();
      return;
    }
    
    if (inputPin.length < 4) {
      Haptic.tap();
      const newPin = inputPin + num;
      setInputPin(newPin);
      
      if (newPin.length === 4) {
        processPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (inputPin.length > 0) {
      Haptic.tap();
      setInputPin(inputPin.slice(0, -1));
      setError('');
    }
  };

  const processPin = async (pin) => {
    if (mode === 'setup') {
      if (pin === '0000') {
        setError('0000 is reserved for duress wipe');
        setInputPin('');
        Haptic.error();
        return;
      }
      setSetupPin(pin);
      setInputPin('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      if (pin === setupPin) {
        const hash = await hashPIN(pin);
        localStorage.setItem('sharednet_pin_hash', hash);
        setPinHash(hash);
        setIsLocked(false);
        Haptic.success();
      } else {
        setError('PINs do not match');
        setInputPin('');
        setMode('setup');
        Haptic.error();
      }
      return;
    }

    if (mode === 'verify') {
      // Duress PIN Check (Wipes Data)
      if (pin === '0000') {
        await clearAllData();
        localStorage.clear(); // Wipes everything including identity
        window.location.reload(); // Hard reset
        return;
      }

      const hash = await hashPIN(pin);
      if (hash === pinHash) {
        // Success
        localStorage.setItem('sharednet_pin_attempts', '0');
        setIsLocked(false);
        Haptic.success();
      } else {
        // Failure
        Haptic.error();
        let attempts = parseInt(localStorage.getItem('sharednet_pin_attempts') || '0', 10) + 1;
        if (attempts >= 3) {
          const lockoutUntil = Date.now() + 30000; // 30 seconds
          localStorage.setItem('sharednet_lockout_until', lockoutUntil.toString());
          localStorage.setItem('sharednet_pin_attempts', '0'); // reset for next round
          setLockoutTime(30);
          setError('Locked out');
        } else {
          localStorage.setItem('sharednet_pin_attempts', attempts.toString());
          setError(`Incorrect PIN. ${3 - attempts} attempts left.`);
        }
        setInputPin('');
      }
    }
  };

  if (!isLocked && pinHash) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999999] bg-[#0A0A0F] flex flex-col items-center justify-center p-6 select-none">
      <AnimatePresence mode="wait">
        <motion.div 
          key={mode + (lockoutTime > 0 ? 'lock' : 'open')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-sm flex flex-col items-center gap-8"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center mx-auto mb-4 border border-slate-800">
              {lockoutTime > 0 ? (
                <ShieldAlert className="text-[#FF3B30]" size={32} />
              ) : mode === 'verify' ? (
                <Lock className="text-[#0A84FF]" size={32} />
              ) : (
                <Unlock className="text-[#34C759]" size={32} />
              )}
            </div>
            <h1 className="text-xl font-black text-white uppercase tracking-widest">
              {lockoutTime > 0 ? 'Device Locked' : mode === 'setup' ? 'Set Master PIN' : mode === 'confirm' ? 'Confirm PIN' : 'Enter PIN'}
            </h1>
            <p className="text-xs text-slate-500 max-w-[250px] mx-auto">
              {lockoutTime > 0 
                ? `Too many failed attempts. Wait ${lockoutTime} seconds.`
                : mode === 'setup' 
                ? 'This PIN protects your offline data mesh.' 
                : mode === 'confirm' 
                ? 'Enter the 4 digits again to verify.' 
                : 'Authentication required to access SharedNet.'}
            </p>
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-4 my-2">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < inputPin.length 
                    ? 'bg-[#0A84FF] shadow-[0_0_10px_rgba(10,132,255,0.5)]' 
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          <div className="h-6">
            <AnimatePresence>
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="text-xs text-[#FF3B30] font-bold tracking-wider uppercase text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full px-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                disabled={lockoutTime > 0}
                className="w-16 h-16 mx-auto rounded-full bg-[#1C1C1E] border border-slate-800 text-white text-2xl font-light active:bg-[#2C2C2E] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space bottom left */}
            <button
              onClick={() => handleKeyPress('0')}
              disabled={lockoutTime > 0}
              className="w-16 h-16 mx-auto rounded-full bg-[#1C1C1E] border border-slate-800 text-white text-2xl font-light active:bg-[#2C2C2E] active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={lockoutTime > 0 || inputPin.length === 0}
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-slate-500 active:text-white active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100"
            >
              <XCircle size={28} strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
