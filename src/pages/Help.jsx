import React, { useState } from 'react';
import { Shield, Zap, QrCode, Inbox, Radio, Mic, Lock, Database } from 'lucide-react';

const Help = () => {
  const [activeTab, setActiveTab] = useState('basics');

  const card = {
    borderRadius: 0,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)',
    padding: 20,
    marginBottom: 16
  };

  const tabs = [
    { id: 'basics', label: 'The Basics' },
    { id: 'features', label: 'How To Use Features' },
    { id: 'offline', label: 'Offline Mode' }
  ];

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, color: '#475569', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
          Operator Manual
        </p>
        <h1 className="heading-xl" style={{ fontWeight: 900, lineHeight: 1, margin: 0 }}>
          How to Use<span className="text-gradient-primary"> SharedNet</span>
        </h1>
      </div>

      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', marginBottom: 20 }} />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              background: activeTab === tab.id ? 'rgba(59,130,246,0.1)' : 'transparent',
              color: activeTab === tab.id ? '#60a5fa' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'basics' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Shield size={24} color="#60a5fa" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#e2e8f0' }}>What is SharedNet?</h2>
          </div>
          <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 12 }}>
            <strong>SharedNet</strong> is a rescue tool designed for situations where there is <strong>no internet, no cell service, and no wifi</strong>. 
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
            If you need to send an SOS or important message, the app breaks your message into tiny "shards". 
            These shards can be passed directly from phone to phone (via screen scanning or sound). 
            Once enough people carry the shards to a safe zone with internet, the message reconstructs itself and is sent.
          </p>
        </div>
      )}

      {activeTab === 'features' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <FeatureRow
            icon={Zap} color="#ef4444" title="1. Send a Message (3 Modes)"
            desc="Tap 'Critical SOS', 'Intel Drop', or 'Safe Check-in' on the home page. Type your message or take a photo/voice memo. The app splits it into secure puzzle pieces."
          />
          
          <FeatureRow
            icon={QrCode} color="#34d399" title="2. Scan & Intercept"
            desc="Tap 'Intercept' to open your camera. Point it at someone else's screen when they are showing a QR code to collect their puzzle pieces."
          />

          <FeatureRow
            icon={Radio} color="#a78bfa" title="3. Burst Mode (Fast Send)"
            desc="When sharing a message, tap 'ENTER FULL-SCREEN BURST MODE'. Your screen flashes all the QR codes rapidly so another person can scan them all in seconds."
          />

          <FeatureRow
            icon={Inbox} color="#60a5fa" title="4. Intel Hub (Inbox)"
            desc="Watch your collected puzzle pieces magically snap together! Once you collect enough pieces, the full message unlocks here."
          />

          <FeatureRow
            icon={Shield} color="#fca5a5" title="5. Emergency ID Card"
            desc="Tap 'Configure Emergency ID' on the home page. Enter your Name, Blood Type, and Medical Notes. If you ever press 'Critical SOS', this info is secretly attached to your signal!"
          />

          <FeatureRow
            icon={Database} color="#d8b4fe" title="6. Ghost Auto-Relay"
            desc="You don't have to do anything for this! If the app is open, it silently acts as a bridge, securely passing messages to other nearby phones in the background."
          />

          <FeatureRow
            icon={Lock} color="#94a3b8" title="7. Stealth Vault & Battery Saver"
            desc="Locks your data from strangers. Also, if your battery drops below 10%, the app turns off background relays to save power for your own survival."
          />

        </div>
      )}

      {activeTab === 'offline' && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Database size={24} color="#34d399" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#e2e8f0' }}>Does it work offline?</h2>
          </div>
          <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 12 }}>
            <strong>Yes! That is the entire point.</strong>
          </p>
          <ul style={{ paddingLeft: 20, margin: 0, color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>
            <li>When you have internet, open the app once. It will save itself to your phone.</li>
            <li>You can now add it to your Home Screen.</li>
            <li>Even if you turn on Airplane Mode, the app will open and all features (Scanning, Pulse, Whisper) will work perfectly.</li>
          </ul>
        </div>
      )}

    </div>
  );
};

const FeatureRow = ({ icon: Icon, color, title, desc }) => (
  <div style={{
    display: 'flex', gap: 16, padding: 16, borderRadius: 0,
    border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)'
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 0, background: 'rgba(255,255,255,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#e2e8f0' }}>{title}</h3>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </div>
  </div>
);

export default Help;
