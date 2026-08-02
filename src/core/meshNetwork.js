/**
 * meshNetwork.js
 * Browser-only WebRTC mesh adapter using SimplePeer.
 * 
 * DESIGN DECISIONS:
 * 1. No STUN/TURN servers — LAN-only mesh, keeps SDP small for QR codes.
 * 2. QR scanning only for FIRST connection. After that, relay-based auto-pairing.
 * 3. Passphrase-fallback for mobile paste (QR may fail with dense data).
 */

import SimplePeer from 'simple-peer';
import * as Core from './meshCore.js';

export class MeshNetwork {
  constructor() {
    this.nodeId = null;
    this.keyPair = null;
    this.publicJwk = null;
    this.peers = new Map();           // peerId -> { conn, publicJwk, lastSeen }
    this.peerListCache = new Map();   // peerId -> [ids that peer can reach]
    this.queue = Core.createQueue();
    this.messageHandlers = [];
    this.broadcastKeyPromise = null;
    this.seenMessageIds = new Set();
    this._pendingOutbound = null;
    this._pendingRelay = {};
    this._queueInterval = null;
    this._statusInterval = null;
    this._initialized = false;
  }

  async init(nodeId, broadcastPassphrase = 'sharednet-emergency-key') {
    if (this._initialized) return this;
    this.nodeId = nodeId;
    this.keyPair = await Core.generateIdentityKeyPair();
    this.publicJwk = await Core.exportPublicKeyJwk(this.keyPair.publicKey);
    this.broadcastKeyPromise = Core.deriveBroadcastKey(broadcastPassphrase);
    
    // Tick the store-and-forward queue every 3s
    this._queueInterval = setInterval(() => this._tickQueue(), 3000);
    
    this._initialized = true;
    console.log(`[Mesh] Node ${nodeId} initialized with RSA-2048 identity`);
    return this;
  }

  destroy() {
    if (this._queueInterval) clearInterval(this._queueInterval);
    if (this._statusInterval) clearInterval(this._statusInterval);
    for (const [, peer] of this.peers) {
      try { peer.conn.destroy(); } catch (e) { /* silent */ }
    }
    this.peers.clear();
    this._initialized = false;
  }

  // ---------- QR/Share Pairing: Step 1 — Create Offer ----------

  createOfferPayload() {
    return new Promise((resolve, reject) => {
      const peerConn = new SimplePeer({ initiator: true, trickle: false, config: { iceServers: [] } });

      peerConn.on('signal', (data) => {
        const payload = JSON.stringify({ v: 1, from: this.nodeId, pubKey: this.publicJwk, signal: data });
        resolve({ payload, _conn: peerConn });
      });

      peerConn.on('error', (err) => {
        console.warn('[Mesh] Offer creation error:', err);
        reject(err);
      });

      this._pendingOutbound = { peerConn };
    });
  }

  // ---------- QR/Share Pairing: Step 2 — Accept Offer, Return Answer ----------

  acceptOfferPayload(offerPayloadStr) {
    return new Promise((resolve, reject) => {
      try {
        const offer = JSON.parse(offerPayloadStr);
        const peerConn = new SimplePeer({ initiator: false, trickle: false, config: { iceServers: [] } });

        peerConn.on('signal', (data) => {
          const answerPayload = JSON.stringify({ v: 1, from: this.nodeId, pubKey: this.publicJwk, signal: data });
          resolve(answerPayload);
        });

        peerConn.on('error', (err) => {
          console.warn('[Mesh] Accept offer error:', err);
          reject(err);
        });

        this._wireUpPeer(peerConn, offer.from, offer.pubKey);
        peerConn.signal(offer.signal);
      } catch (e) {
        reject(e);
      }
    });
  }

  // ---------- QR/Share Pairing: Step 3 — Complete Outbound ----------

  completeOutboundConnection(answerPayloadStr) {
    const answer = JSON.parse(answerPayloadStr);
    const { peerConn } = this._pendingOutbound;
    this._wireUpPeer(peerConn, answer.from, answer.pubKey);
    peerConn.signal(answer.signal);
    this._pendingOutbound = null;
  }

  // ---------- Relay-based auto-pairing (no QR needed after first connection) ----------

  connectViaRelay(targetNodeId, viaPeerId) {
    return new Promise((resolve, reject) => {
      const relayPeer = this.peers.get(viaPeerId);
      if (!relayPeer) return reject(new Error('Relay peer not connected'));

      const peerConn = new SimplePeer({ initiator: true, trickle: false, config: { iceServers: [] } });
      
      peerConn.on('signal', (data) => {
        const signalStr = JSON.stringify({
          __meshControl: 'relay-signal',
          targetNodeId,
          fromNodeId: this.nodeId,
          fromPubKey: this.publicJwk,
          signal: data,
        });
        relayPeer.conn.send(signalStr);
        this._emitEvent('bytes-transferred', { bytes: signalStr.length, direction: 'tx' });
      });

      peerConn.on('error', reject);
      peerConn.on('connect', () => resolve());

      this._pendingRelay[targetNodeId] = peerConn;
    });
  }

  _handleRelaySignal(msg, fromPeerId) {
    if (msg.targetNodeId === this.nodeId) {
      let peerConn = this._pendingRelay[msg.fromNodeId];
      if (!peerConn) {
        peerConn = new SimplePeer({ initiator: false, trickle: false, config: { iceServers: [] } });
        this._wireUpPeer(peerConn, msg.fromNodeId, msg.fromPubKey);
        peerConn.on('signal', (answerData) => {
          const relayPeer = this.peers.get(fromPeerId);
          if (relayPeer) {
            const signalStr = JSON.stringify({
              __meshControl: 'relay-signal',
              targetNodeId: msg.fromNodeId,
              fromNodeId: this.nodeId,
              fromPubKey: this.publicJwk,
              signal: answerData,
            });
            relayPeer.conn.send(signalStr);
            this._emitEvent('bytes-transferred', { bytes: signalStr.length, direction: 'tx' });
          }
        });
      }
      peerConn.signal(msg.signal);
    } else if (this.peers.has(msg.targetNodeId)) {
      // Middle hop — pass through
      const msgStr = JSON.stringify(msg);
      this.peers.get(msg.targetNodeId).conn.send(msgStr);
      this._emitEvent('bytes-transferred', { bytes: msgStr.length, direction: 'tx' });
    }
  }

  // ---------- Peer wiring ----------

  _wireUpPeer(peerConn, remoteNodeId, remotePubKeyJwk) {
    peerConn.on('connect', () => {
      this.peers.set(remoteNodeId, { conn: peerConn, publicJwk: remotePubKeyJwk, lastSeen: Date.now() });
      console.log(`[Mesh] ✅ Connected to peer: ${remoteNodeId}`);
      
      // Exchange peer lists with public keys for multi-hop encryption
      const peersWithKeys = [...this.peers.entries()].map(([id, p]) => ({ id, publicJwk: p.publicJwk }));
      const listStr = JSON.stringify({ __meshControl: 'peer-list', peers: peersWithKeys });
      peerConn.send(listStr);
      this._emitEvent('bytes-transferred', { bytes: listStr.length, direction: 'tx' });
      
      // Notify handlers
      this._emitEvent('peer-connected', { peerId: remoteNodeId });
    });

    peerConn.on('data', (data) => {
      this._emitEvent('bytes-transferred', { bytes: data.length, direction: 'rx' });
      this._handleIncomingRaw(data.toString(), remoteNodeId);
    });

    peerConn.on('close', () => {
      this.peers.delete(remoteNodeId);
      console.log(`[Mesh] ❌ Disconnected from peer: ${remoteNodeId}`);
      this._emitEvent('peer-disconnected', { peerId: remoteNodeId });
    });

    peerConn.on('error', (err) => {
      console.warn(`[Mesh] Peer error (${remoteNodeId}):`, err.message);
    });
  }

  async _handleIncomingRaw(raw, fromPeerId) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // Handle control messages
    if (msg.__meshControl === 'relay-signal') return this._handleRelaySignal(msg, fromPeerId);
    if (msg.__meshControl === 'peer-list') {
      this.peerListCache.set(fromPeerId, msg.peers || []);
      return;
    }

    // Update lastSeen
    const peer = this.peers.get(fromPeerId);
    if (peer) peer.lastSeen = Date.now();

    // Dedupe
    if (this.seenMessageIds.has(msg.id)) return;
    this.seenMessageIds.add(msg.id);

    // Attach local receipt timestamp
    msg.receivedAt = Date.now();

    // Relay logic
    const result = Core.evaluateIncomingMessage(msg, this.nodeId);
    if (result.deliverLocally) await this._deliverLocally(msg);
    if (result.forward) this._floodToAllExcept(result.outgoing, [fromPeerId]);
  }

  async _deliverLocally(msg) {
    try {
      let plaintext;
      if (msg.type === 'direct') {
        plaintext = await Core.decryptDirect(msg.payload, this.keyPair.privateKey);
      } else if (msg.type === 'squad') {
        // Pass through encrypted, MeshProvider handles it
        plaintext = msg.payload;
      } else {
        const key = await this.broadcastKeyPromise;
        plaintext = await Core.decryptBroadcast(msg.payload, key);
      }
      const decoded = { ...msg, plaintext };
      this.messageHandlers.forEach((cb) => {
        try { cb(decoded); } catch (e) { console.warn('[Mesh] Handler error:', e); }
      });
      this._emitEvent('mesh-message', decoded);
    } catch (e) {
      console.warn('[Mesh] Could not decrypt inbound message:', e.message);
    }
  }

  _floodToAllExcept(message, excludePeerIds) {
    const msgStr = JSON.stringify(message);
    for (const [peerId, peer] of this.peers) {
      if (excludePeerIds.includes(peerId)) continue;
      try {
        peer.conn.send(msgStr);
        this._emitEvent('bytes-transferred', { bytes: msgStr.length, direction: 'tx' });
      } catch (e) {
        console.warn(`[Mesh] Failed to send to ${peerId}:`, e.message);
      }
    }
  }

  _emitEvent(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (e) { /* SSR guard */ }
  }

  // ---------- Public API ----------

  async broadcast(plaintext, type = 'broadcast', ttl = 10800000, category = 'INFO', extra = {}) {
    const key = await this.broadcastKeyPromise;
    const payload = await Core.encryptBroadcast(plaintext, key);
    const message = Core.createMessage({ type, from: this.nodeId, ttl, category, payload, extra });
    this.seenMessageIds.add(message.id);
    this._floodToAllExcept(message, []);
    return { reachableNow: this.peers.size, message };
  }

  async broadcastRaw(payload, type = 'squad', ttl = 10800000, category = 'INFO', extra = {}) {
    const message = Core.createMessage({ type, from: this.nodeId, ttl, category, payload, extra });
    this.seenMessageIds.add(message.id);
    this._floodToAllExcept(message, []);
    return { reachableNow: this.peers.size, message };
  }

  async sendDirect(targetNodeId, plaintext, ttl = 10800000, category = 'INFO') {
    const targetPeer = this.peers.get(targetNodeId);
    let targetPubKey = null;

    if (targetPeer) {
      targetPubKey = await Core.importPublicKeyJwk(targetPeer.publicJwk);
    } else {
      // Search in peerListCache for the target node's public key (for multi-hop encryption)
      for (const list of this.peerListCache.values()) {
        const remoteNode = list.find(p => (typeof p === 'object' ? p.id === targetNodeId : p === targetNodeId));
        if (remoteNode && remoteNode.publicJwk) {
          targetPubKey = await Core.importPublicKeyJwk(remoteNode.publicJwk);
          break;
        }
      }
    }

    if (!targetPubKey) throw new Error('No public key for that node — cannot encrypt.');

    const payload = await Core.encryptDirect(plaintext, targetPubKey);
    const message = Core.createMessage({ type: 'direct', from: this.nodeId, to: targetNodeId, ttl, category, payload });
    this.seenMessageIds.add(message.id);
    this._floodToAllExcept(message, []);

    if (!targetPeer) {
      Core.enqueuePending(this.queue, message, targetNodeId);
    }
    return message;
  }

  _tickQueue() {
    const isReachable = (targetId) =>
      this.peers.has(targetId) ||
      [...this.peerListCache.values()].some((list) => 
        list.some(p => (typeof p === 'object' ? p.id === targetId : p === targetId))
      );
    const { toSend } = Core.tickQueue(this.queue, Date.now(), isReachable);
    toSend.forEach((item) => this._floodToAllExcept(item.message, []));
  }

  // ---------- Status heartbeat ----------

  startStatusBroadcast(intervalMs = 30000) {
    if (this._statusInterval) clearInterval(this._statusInterval);
    this._statusInterval = setInterval(async () => {
      const battery = navigator.getBattery ? await navigator.getBattery().then(b => Math.round(b.level * 100)).catch(() => null) : null;
      await this.broadcast(
        JSON.stringify({ status: 'safe', battery, peerCount: this.peers.size }),
        'status',
        3
      );
    }, intervalMs);
  }

  // ---------- Introspection ----------

  getPeers() {
    return [...this.peers.entries()].map(([id, p]) => ({
      id,
      lastSeen: p.lastSeen,
      isConnected: true,
    }));
  }

  getPeerCount() {
    return this.peers.size;
  }

  getReachableCount() {
    const directPeers = new Set(this.peers.keys());
    for (const list of this.peerListCache.values()) {
      list.forEach((p) => directPeers.add(typeof p === 'object' ? p.id : p));
    }
    return directPeers.size;
  }

  getAllKnownPeers() {
    const all = new Map();
    // Direct peers
    for (const [id, p] of this.peers.entries()) {
      all.set(id, { id, isDirect: true, lastSeen: p.lastSeen });
    }
    // Multi-hop peers
    for (const [via, list] of this.peerListCache.entries()) {
      list.forEach((p) => {
        const id = typeof p === 'object' ? p.id : p;
        if (!all.has(id) && id !== this.nodeId) {
          all.set(id, { id, isDirect: false, via, lastSeen: Date.now() });
        }
      });
    }
    return Array.from(all.values());
  }

  getPendingMessages() {
    return this.queue.items.map((i) => ({ targetId: i.targetId, attempts: i.attempts, maxAttempts: i.maxAttempts }));
  }

  onMessage(cb) {
    this.messageHandlers.push(cb);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== cb);
    };
  }
}

// Singleton for app-wide use
let _instance = null;
export function getMeshInstance() {
  if (!_instance) _instance = new MeshNetwork();
  return _instance;
}
