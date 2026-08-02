import React, { useState, useEffect } from 'react';
import { Phone, Users, ShieldAlert, Plus, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../storage/db';

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const all = await db.emergencyContacts.toArray();
      setContacts(all);
    } catch (e) {
      console.warn('Failed to load contacts', e);
    }
  };

  const handleSave = async () => {
    if (!newContact.name || !newContact.phone) return;
    try {
      if (editingId) {
        await db.emergencyContacts.put({
          id: editingId,
          name: newContact.name,
          phone: newContact.phone
        });
      } else {
        await db.emergencyContacts.put({
          name: newContact.name,
          phone: newContact.phone
        });
      }
      setNewContact({ name: '', phone: '' });
      setEditingId(null);
      setShowAddForm(false);
      loadContacts();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'success', message: 'Emergency Contact Saved' } }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { type: 'error', message: 'Failed to save contact' } }));
    }
  };

  const handleEdit = (contact) => {
    setNewContact({ name: contact.name, phone: contact.phone });
    setEditingId(contact.id);
    setShowAddForm(true);
  };

  const alertContact = (phone) => {
    const msg = `SOS! I need emergency assistance.`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(msg)}`;
  };

  const handleDelete = async (id) => {
    try {
      await db.emergencyContacts.delete(id);
      loadContacts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <div className="p-4 space-y-6 flex-1">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Emergency Contacts</h1>
          <p className="text-[#8B8B9A] text-base leading-relaxed">
            When you trigger an SOS, contacts are alerted via native SMS — no internet required.
          </p>
        </div>

        {/* Contact List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#5A5A6A] tracking-[0.1em] uppercase">
              {contacts.length} CONTACTS REGISTERED
            </h2>
          </div>

          <AnimatePresence>
            {contacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#141419] border border-[#2A2A35] rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center font-bold text-xl">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                    <p className="text-[#8B8B9A] text-sm font-mono mt-0.5">{contact.phone}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 mt-4 sm:mt-0 sm:flex-row">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(contact)}
                      className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center hover:bg-[#3B82F6]/20 transition-colors"
                    >
                      <span className="text-xs font-bold">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(contact.id)}
                      className="w-12 h-12 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center hover:bg-[#EF4444]/20 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={() => alertContact(contact.phone)}
                    className="flex-1 min-w-[120px] h-12 rounded-xl bg-[#FF3B30] text-white flex items-center justify-center font-bold text-xs uppercase hover:bg-[#FF3B30]/80 transition-colors gap-2"
                  >
                    <ShieldAlert size={16} />
                    ALERT NOW
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Button */}
        <button
          onClick={() => {
            setEditingId(null);
            setNewContact({ name: '', phone: '' });
            setShowAddForm(true);
          }}
          className="w-full min-h-[64px] rounded-2xl border-2 border-dashed border-[#2A2A35] text-[#8B8B9A] font-bold flex items-center justify-center gap-2 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
        >
          <Plus size={24} />
          ADD EMERGENCY CONTACT
        </button>

      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-[#0A0A0F]/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-[#141419] border border-[#2A2A35] rounded-3xl w-full max-w-md p-6 flex flex-col gap-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">New Contact</h3>
                <button 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    setNewContact({ name: '', phone: '' });
                  }}
                  className="w-12 h-12 rounded-full bg-[#2A2A35]/50 flex items-center justify-center text-[#8B8B9A] hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#5A5A6A] tracking-[0.1em] uppercase block mb-2">Name</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-[#5A5A6A] focus:outline-none focus:border-[#3B82F6]"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#5A5A6A] tracking-[0.1em] uppercase block mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full bg-[#0A0A0F] border border-[#2A2A35] rounded-xl p-4 text-white placeholder-[#5A5A6A] font-mono focus:outline-none focus:border-[#3B82F6]"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!newContact.name || !newContact.phone}
                className="w-full min-h-[56px] rounded-xl bg-[#3B82F6] text-white font-bold disabled:opacity-50 transition-colors"
              >
                SAVE CONTACT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
