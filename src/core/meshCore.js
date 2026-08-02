/**
 * meshCore.js
 * Pure logic for SharedNet's mesh layer — no WebRTC, no DOM, no network I/O.
 * Everything here is testable in isolation.
 * The browser-only WebRTC adapter (meshNetwork.js) imports and wires this up.
 */

// ---------- Relay / flood-gossip logic ----------

/**
 * Decide whether an incoming message should be (a) delivered locally and
 * (b) forwarded on, and produce the mutated message to forward.
 *
 * @param {object} message  { id, type, from, to, ttl, visited: string[], payload, timestamp }
 * @param {string} selfId
 * @returns {{ deliverLocally: boolean, forward: boolean, outgoing: object|null, reason: string }}
 */
export function evaluateIncomingMessage(message, selfId) {
  if (!message || typeof message.id !== 'string') {
    return { deliverLocally: false, forward: false, outgoing: null, reason: 'malformed' };
  }

  // Loop prevention: if we've already seen/relayed this message, drop it silently.
  if (Array.isArray(message.visited) && message.visited.includes(selfId)) {
    return { deliverLocally: false, forward: false, outgoing: null, reason: 'already-visited' };
  }

  const isForMe = message.type === 'direct' && message.to === selfId;
  const isBroadcastLike = message.type === 'broadcast' || message.type === 'sos' || message.type === 'status' || message.type === 'evidence' || message.type === 'forum' || message.type === 'chat' || message.type === 'squad';

  const deliverLocally = isForMe || isBroadcastLike;

  // Direct messages addressed to someone else still relay (multi-hop),
  // but we do NOT "deliver" them locally — we can't decrypt them.
  const hopsRemaining = (message.hopsRemaining ?? 7) - 1;
  const shouldForward = hopsRemaining > 0 && !isForMe;

  let outgoing = null;
  if (shouldForward) {
    outgoing = {
      ...message,
      hopsRemaining,
      visited: [...(message.visited || []), selfId],
    };
  }

  return { deliverLocally, forward: shouldForward, outgoing, reason: 'ok' };
}

/**
 * Build a brand-new outgoing message.
 */
export function createMessage({ type, from, to = null, hopsRemaining = 7, ttl = 10800000, category = 'INFO', payload, extra = {} }) {
  return {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    from,
    to,
    hopsRemaining,
    ttl,
    category,
    visited: [from],
    payload,
    timestamp: Date.now(),
    ...extra,
  };
}

// ---------- Store-and-forward queue ----------

export function createQueue() {
  return { items: [] };
}

export function enqueuePending(queue, message, targetId, maxAttempts = 10) {
  queue.items.push({ message, targetId, attempts: 0, maxAttempts, nextRetryAt: Date.now() });
}

/**
 * Return items ready to (re)attempt now, and those that have expired.
 */
export function tickQueue(queue, now, isReachable) {
  const toSend = [];
  const expired = [];
  queue.items = queue.items.filter((item) => {
    if (item.attempts >= item.maxAttempts) {
      expired.push(item);
      return false;
    }
    if (now >= item.nextRetryAt && isReachable(item.targetId)) {
      item.attempts += 1;
      item.nextRetryAt = now + 10_000;
      toSend.push(item);
    }
    return true;
  });
  return { toSend, expired };
}

export function removeFromQueue(queue, messageId) {
  queue.items = queue.items.filter((item) => item.message.id !== messageId);
}

// ---------- Encryption: hybrid RSA-OAEP + AES-GCM for direct messages ----------

export async function generateIdentityKeyPair() {
  return crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['wrapKey', 'unwrapKey']
  );
}

export async function exportPublicKeyJwk(publicKey) {
  return crypto.subtle.exportKey('jwk', publicKey);
}

export async function importPublicKeyJwk(jwk) {
  return crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['wrapKey']
  );
}

export function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function b64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
}

/**
 * Encrypt plaintext for a single recipient (hybrid RSA-OAEP + AES-GCM).
 */
export async function encryptDirect(plaintext, recipientPublicKey) {
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new TextEncoder().encode(plaintext));
  const wrappedKey = await crypto.subtle.wrapKey('raw', aesKey, recipientPublicKey, { name: 'RSA-OAEP' });
  return {
    wrappedKey: bufToB64(wrappedKey),
    iv: bufToB64(iv),
    ciphertext: bufToB64(encrypted),
  };
}

export async function decryptDirect(packageObj, myPrivateKey) {
  const aesKey = await crypto.subtle.unwrapKey(
    'raw',
    b64ToBuf(packageObj.wrappedKey),
    myPrivateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );
  const iv = new Uint8Array(b64ToBuf(packageObj.iv));
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, b64ToBuf(packageObj.ciphertext));
  return new TextDecoder().decode(plainBuf);
}

// ---------- Encryption: shared-passphrase AES-GCM for broadcast/SOS ----------

export async function deriveBroadcastKey(passphrase) {
  const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('sharednet-fixed-salt'), iterations: 100_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptBroadcast(plaintext, broadcastKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, broadcastKey, new TextEncoder().encode(plaintext));
  return { iv: bufToB64(iv), ciphertext: bufToB64(encrypted) };
}

export async function decryptBroadcast(packageObj, broadcastKey) {
  const iv = new Uint8Array(b64ToBuf(packageObj.iv));
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, broadcastKey, b64ToBuf(packageObj.ciphertext));
  return new TextDecoder().decode(plainBuf);
}
