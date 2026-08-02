import React, { useState, useEffect } from 'react';
import { Shield, Key, Plus, Trash2, Users } from 'lucide-react';
import { db } from '../storage/db';

export default function Squads() {
  const [squads, setSquads] = useState([]);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadKey, setNewSquadKey] = useState('');

  useEffect(() => {
    loadSquads();
  }, []);

  const loadSquads = async () => {
    try {
      const all = await db.squads.toArray();
      setSquads(all);
    } catch(e) {}
  };

  const handleCreate = async () => {
    if (!newSquadName.trim() || !newSquadKey.trim()) return;
    try {
      await db.squads.put({
        name: newSquadName,
        secretKey: newSquadKey,
        addedAt: Date.now()
      });
      setNewSquadName('');
      setNewSquadKey('');
      loadSquads();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Squad channel added' } }));
    } catch(e) {}
  };

  const handleDelete = async (name) => {
    if (window.confirm(`Delete squad channel '${name}'?`)) {
      try {
        await db.squads.delete(name);
        loadSquads();
      } catch(e) {}
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-48 px-6 pt-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-h1 text-white flex items-center gap-3">
            <Users className="text-[#0A84FF]" size={28} />
            Squad Channels
          </h1>
          <p className="text-body-sm text-slate-400">Encrypted Private Mesh Groups</p>
        </div>
      </div>

      <div className="card p-6 bg-[#1C1C1E] border border-slate-800 rounded-xl space-y-4">
        <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-500">Join / Create Squad</h3>
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Squad Name (e.g. Alpha Team)" 
            value={newSquadName}
            onChange={e => setNewSquadName(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF]"
          />
          <input 
            type="text" 
            placeholder="Shared Secret Passphrase" 
            value={newSquadKey}
            onChange={e => setNewSquadKey(e.target.value)}
            className="w-full bg-[#0A0A0F] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF]"
          />
          <button 
            onClick={handleCreate}
            disabled={!newSquadName || !newSquadKey}
            className="btn-premium w-full bg-[#0A84FF] text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} /> Save Squad Key
          </button>
        </div>
        <p className="text-xs text-slate-500 italic mt-2">
          Note: Any mesh user with the exact Secret Passphrase can decrypt messages sent to this Squad channel.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-500 mb-2">Active Squads</h3>
        {squads.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
            <Shield className="mx-auto mb-2 text-slate-600" size={24} />
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">No Active Squads</p>
          </div>
        ) : (
          squads.map(s => (
            <div key={s.name} className="p-4 bento-card border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0A84FF]/20 text-[#0A84FF] rounded-lg">
                  <Key size={16} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-[14px] text-slate-500 font-mono">Encrypted Channel</p>
                </div>
              </div>
              <button onClick={() => handleDelete(s.name)} className="text-slate-500 hover:text-[#FF3B30] transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
