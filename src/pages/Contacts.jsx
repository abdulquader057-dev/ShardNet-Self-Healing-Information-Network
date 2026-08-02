import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, QrCode as QrCodeIcon, Scan, Users, X, CheckCircle2 } from 'lucide-react';
import { db } from '../storage/db';
import { useMesh } from '../core/MeshProvider';
import { QRCodeSVG } from 'qrcode.react';

export default function Contacts() {
  const { nodeId } = useMesh();
  const [contacts, setContacts] = useState([]);
  const [mode, setMode] = useState('list'); // list | show_qr | scan_qr
  const [alias, setAlias] = useState(localStorage.getItem('setting_device_name') || 'Anonymous');
  const [scanInput, setScanInput] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const all = await db.contacts.toArray();
      setContacts(all);
    } catch(e) {}
  };

  const myIdentityPayload = JSON.stringify({
    type: 'contact_exchange',
    nodeId,
    alias
  });

  const handleManualAdd = async () => {
    try {
      const data = JSON.parse(scanInput);
      if (data.type === 'contact_exchange' && data.nodeId && data.alias) {
        await db.contacts.put({
          nodeId: data.nodeId,
          alias: data.alias,
          addedAt: Date.now(),
          lastSeen: Date.now()
        });
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: `Added ${data.alias} to contacts!` } }));
        setScanInput('');
        setMode('list');
        loadContacts();
      } else {
        throw new Error("Invalid format");
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Invalid Contact QR payload' } }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-48 px-6 pt-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-white flex items-center gap-3">
            <Users className="text-[#0A84FF]" size={28} />
            Contacts
          </h1>
          <p className="text-body-sm text-slate-400">Offline mesh directory</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setMode('show_qr')}
          className="bento-card p-4 flex flex-col items-center justify-center gap-2 border-white/5 hover:border-[#0A84FF]/50 transition-colors"
        >
          <QrCodeIcon size={24} className="text-[#0A84FF]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">My QR Card</span>
        </button>
        <button 
          onClick={() => setMode('scan_qr')}
          className="bento-card p-4 flex flex-col items-center justify-center gap-2 border-white/5 hover:border-[#34C759]/50 transition-colors"
        >
          <Scan size={24} className="text-[#34C759]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Scan QR</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'show_qr' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bento-card p-6 flex flex-col items-center gap-6 overflow-hidden"
          >
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">{alias}</h3>
              <p className="text-xs text-slate-500 font-mono">{nodeId}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl">
              <QRCodeSVG value={myIdentityPayload} size={200} level="H" />
            </div>
            <button onClick={() => setMode('list')} className="btn-premium btn-outline w-full">
              CLOSE
            </button>
          </motion.div>
        )}

        {mode === 'scan_qr' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bento-card p-6 space-y-4 overflow-hidden"
          >
            <p className="text-xs text-slate-400 text-center">In a real app, this would open the camera. For this web demo, paste the JSON payload from your friend's QR.</p>
            <textarea
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder='{"type":"contact_exchange","nodeId":"...","alias":"..."}'
              className="w-full h-24 bg-[#0A0A0F] border border-slate-700 rounded-xl p-3 text-xs text-slate-300 font-mono focus:border-[#34C759] focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={handleManualAdd} className="btn-premium flex-1 bg-[#34C759] text-black">
                ADD CONTACT
              </button>
              <button onClick={() => setMode('list')} className="p-4 glass rounded-xl text-slate-400">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Saved Contacts</h3>
        {contacts.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
            <UserPlus className="mx-auto mb-2 text-slate-600" size={24} />
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">No contacts yet</p>
          </div>
        ) : (
          contacts.map(c => (
            <div key={c.nodeId} className="p-4 bento-card border-white/5 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{c.alias}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{c.nodeId}</p>
              </div>
              <CheckCircle2 size={16} className="text-[#34C759]" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
