/**
 * MeshProvider.jsx
 * React Context that initializes and exposes the real WebRTC mesh network
 * to all components via the useMesh() hook.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getMeshInstance } from './meshNetwork';
import { db } from '../storage/db';

const MeshContext = createContext(null);

/**
 * Generate or retrieve a stable node ID for this device.
 */
function getStableNodeId() {
  const KEY = 'sharednet_node_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    id = `SN-${rand}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function MeshProvider({ children }) {
  const meshRef = useRef(null);
  const [peers, setPeers] = useState([]);
  const [peerCount, setPeerCount] = useState(0);
  const [reachableCount, setReachableCount] = useState(0);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [lastMessage, setLastMessage] = useState(null);
  const [bytesTransferred, setBytesTransferred] = useState({ tx: 0, rx: 0 });

  useEffect(() => {
    let mounted = true;
    const mesh = getMeshInstance();
    meshRef.current = mesh;

    const nid = getStableNodeId();
    setNodeId(nid);

    mesh.init(nid).then(() => {
      if (!mounted) return;
      setIsReady(true);
      console.log(`[MeshProvider] Ready — Node ID: ${nid}`);

      // Start status heartbeat (every 30s)
      mesh.startStatusBroadcast(30000);
    }).catch((err) => {
      console.error('[MeshProvider] Init failed:', err);
    });

    // Listen for incoming mesh messages
    const unsubMessage = mesh.onMessage(async (msg) => {
      if (!mounted) return;
      setLastMessage(msg);

      // Dispatch to existing event bus for Inbox/SOS components
      if (msg.type === 'sos') {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'error', message: `🚨 SOS from ${msg.from}: ${msg.plaintext}` }
        }));
        // Add to global signals for Inbox
        if (window.sharedNetData?.signals) {
          window.sharedNetData.signals.unshift({
            id: msg.id,
            type: 'received',
            title: `SOS from ${msg.from}`,
            status: 'active',
            time: 'Just now',
            timestamp: new Date(msg.timestamp).toISOString(),
            location: msg.location || 'Nearby',
            description: msg.plaintext,
            sender: msg.from,
            range: 'Mesh',
            battery: 'N/A',
            source: 'mesh',
          });
          window.dispatchEvent(new CustomEvent('demo-mode-changed'));
        }
      } else if (msg.type === 'broadcast') {
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'info', message: `📡 Mesh broadcast from ${msg.from}` }
        }));
      } else if (msg.type === 'status') {
        // Status heartbeat — could update device list
        try {
          const status = JSON.parse(msg.plaintext);
          window.dispatchEvent(new CustomEvent('mesh-status-update', {
            detail: { from: msg.from, ...status }
          }));
        } catch (e) { /* ignore malformed status */ }
      } else if (msg.type === 'forum') {
        try {
          const post = JSON.parse(msg.plaintext);
          db.forum.put(post).then(() => {
            window.dispatchEvent(new CustomEvent('forum-updated'));
          });
        } catch(e) {}
      } else if (msg.type === 'file') {
        window.dispatchEvent(new CustomEvent('mesh-file-received', { detail: msg }));
        window.dispatchEvent(new CustomEvent('show-toast', {
          detail: { type: 'success', message: `📦 Intel Drop received from ${msg.from}` }
        }));
      } else if (msg.type === 'squad') {
        try {
          // squad messages have the encrypted payload passed through as msg.plaintext
          // msg.extra contains squadName
          const squadName = msg.extra?.squadName;
          if (!squadName) return;
          const squad = await db.squads.get(squadName);
          if (squad) {
            const { deriveBroadcastKey, decryptBroadcast } = await import('./meshCore.js');
            const key = await deriveBroadcastKey(squad.secretKey);
            const decryptedText = await decryptBroadcast(msg.plaintext, key);
            window.dispatchEvent(new CustomEvent('squad-message', {
              detail: { from: msg.from, squadName, content: decryptedText, timestamp: msg.timestamp }
            }));
            window.dispatchEvent(new CustomEvent('show-toast', {
              detail: { type: 'success', message: `🛡️ Squad msg (${squadName}) from ${msg.from}` }
            }));
          }
        } catch(e) {
          console.warn('Failed to decrypt squad message:', e);
        }
      } else if (msg.type === 'direct') {
        try {
          const payload = JSON.parse(msg.plaintext);
          db.history.put({
            timestamp: payload.timestamp || msg.timestamp || Date.now(),
            type: 'direct-message',
            data: {
              to: nodeId,
              from: msg.from,
              text: payload.text
            }
          });
          window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { type: 'success', message: `💬 Direct message from ${msg.from}` }
          }));
        } catch (e) {
          console.warn('Failed to parse direct message:', e);
        }
      }
    });

    // Poll peer state every 2s for reactive UI updates
    const pollInterval = setInterval(() => {
      if (!mounted) return;
      const currentPeers = mesh.getPeers();
      setPeers(currentPeers);
      setPeerCount(mesh.getPeerCount());
      setReachableCount(mesh.getReachableCount());
      setPendingMessages(mesh.getPendingMessages());
    }, 2000);

    // Listen for peer connect/disconnect events
    const onPeerConnected = (e) => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'success', message: `✅ Mesh peer connected: ${e.detail.peerId}` }
      }));
      // Auto-add to contacts
      db.contacts.put({
        nodeId: e.detail.peerId,
        alias: `Node ${e.detail.peerId.slice(-4)}`,
        addedAt: Date.now(),
        lastSeen: Date.now()
      }).catch(err => console.warn('Failed to auto-save contact', err));
    };
    const onPeerDisconnected = (e) => {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { type: 'warning', message: `⚠️ Mesh peer disconnected: ${e.detail.peerId}` }
      }));
    };
    const onBytesTransferred = (e) => {
      const { bytes, direction } = e.detail;
      setBytesTransferred(prev => ({
        ...prev,
        [direction]: prev[direction] + bytes
      }));
    };

    window.addEventListener('peer-connected', onPeerConnected);
    window.addEventListener('peer-disconnected', onPeerDisconnected);
    window.addEventListener('bytes-transferred', onBytesTransferred);

    return () => {
      mounted = false;
      unsubMessage();
      clearInterval(pollInterval);
      window.removeEventListener('peer-connected', onPeerConnected);
      window.removeEventListener('peer-disconnected', onPeerDisconnected);
      window.removeEventListener('bytes-transferred', onBytesTransferred);
    };
  }, []);

  const broadcast = useCallback(async (plaintext, type = 'broadcast', ttl = 7, extra = {}) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) {
      console.warn('[MeshProvider] Mesh not ready yet');
      return { reachableNow: 0 };
    }
    return mesh.broadcast(plaintext, type, ttl, extra);
  }, []);

  const broadcastSquad = useCallback(async (squadName, plaintext, ttl = 7) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) throw new Error('Mesh not ready');
    
    const squad = await db.squads.get(squadName);
    if (!squad) throw new Error('Squad not found');
    
    const { deriveBroadcastKey, encryptBroadcast } = await import('./meshCore.js');
    const key = await deriveBroadcastKey(squad.secretKey);
    const encryptedPayload = await encryptBroadcast(plaintext, key);
    
    return mesh.broadcastRaw(encryptedPayload, 'squad', ttl, { squadName });
  }, []);

  const sendDirect = useCallback(async (targetNodeId, plaintext, ttl = 7) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) throw new Error('Mesh not ready');
    return mesh.sendDirect(targetNodeId, plaintext, ttl);
  }, []);

  const createOffer = useCallback(async () => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) throw new Error('Mesh not ready');
    return mesh.createOfferPayload();
  }, []);

  const acceptOffer = useCallback(async (offerStr) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) throw new Error('Mesh not ready');
    return mesh.acceptOfferPayload(offerStr);
  }, []);

  const completeConnection = useCallback((answerStr) => {
    const mesh = meshRef.current;
    if (!mesh || !mesh._initialized) throw new Error('Mesh not ready');
    mesh.completeOutboundConnection(answerStr);
  }, []);

  const value = {
    mesh: meshRef.current,
    nodeId,
    peers,
    peerCount,
    reachableCount,
    pendingMessages,
    isReady,
    lastMessage,
    bytesTransferred,
    broadcast,
    broadcastSquad,
    sendDirect,
    createOffer,
    acceptOffer,
    completeConnection,
  };

  return (
    <MeshContext.Provider value={value}>
      {children}
    </MeshContext.Provider>
  );
}

/**
 * Hook to access the mesh network from any component.
 * 
 * Usage:
 *   const { mesh, peers, peerCount, broadcast, nodeId } = useMesh();
 */
export function useMesh() {
  const ctx = useContext(MeshContext);
  if (!ctx) {
    // Return a safe fallback when used outside MeshProvider
    return {
      mesh: null,
      nodeId: '',
      peers: [],
      peerCount: 0,
      reachableCount: 0,
      pendingMessages: [],
      isReady: false,
      lastMessage: null,
      bytesTransferred: { tx: 0, rx: 0 },
      broadcast: async () => ({ reachableNow: 0 }),
      sendDirect: async () => {},
      createOffer: async () => ({}),
      acceptOffer: async () => '',
      completeConnection: () => {},
    };
  }
  return ctx;
}
