// Encryption Helpers
const getEncryptionKey = async (messageId) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(messageId);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return await crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const calculateHash = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const compressData = async (text) => {
  try {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new Blob([text]).stream();
      const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
      const response = new Response(compressedStream);
      return await response.arrayBuffer();
    }
    return new TextEncoder().encode(text).buffer;
  } catch (e) {
    return new TextEncoder().encode(text).buffer;
  }
};

const decompressData = async (buffer) => {
  try {
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new Blob([buffer]).stream();
      const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
      const response = new Response(decompressedStream);
      return await response.text();
    }
    return new TextDecoder().decode(buffer);
  } catch (e) {
    return new TextDecoder().decode(buffer);
  }
};

export const calculateChecksum = (data) => {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
};

export const encryptData = async (text, messageId) => {
  try {
    const key = await getEncryptionKey(messageId);
    // Compress before encrypting
    const compressedBuffer = await compressData(text);
    const encoded = new Uint8Array(compressedBuffer);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    
    return {
      cipher: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv)
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    throw err;
  }
};

export const decryptData = async (encrypted, messageId) => {
  try {
    const key = await getEncryptionKey(messageId);
    const iv = base64ToArrayBuffer(encrypted.iv);
    const cipher = base64ToArrayBuffer(encrypted.cipher);
    
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return await decompressData(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
};

/**
 * Splits a message into multiple shards using dynamic sharding.
 */
export const createShards = async (message, category = 'Info', nodeId = 'unknown', priority = 1, location = 'Unknown Sector', previousMessageId = null, geo = null) => {
  const messageId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const messageHash = await calculateHash(message);
  const totalLength = message.length;
  
  // Dynamic Sharding Logic
  let shardCount = 3;
  if (totalLength <= 20) shardCount = 1;
  else if (totalLength <= 100) shardCount = 2;
  else if (totalLength <= 500) shardCount = 3;
  else if (totalLength <= 2000) shardCount = 4;
  else if (totalLength <= 8000) shardCount = 6;
  else shardCount = 8;

  const shardSize = Math.ceil(totalLength / shardCount);
  const shards = [];

  for (let i = 0; i < shardCount; i++) {
    const start = i * shardSize;
    const end = Math.min(start + shardSize, totalLength);
    const rawData = message.substring(start, end);
    
    // Encrypt the fragment
    const encrypted = await encryptData(rawData, messageId);
    const checksum = calculateChecksum(encrypted);

    shards.push({
      id: `${messageId}-${i}`,
      messageId,
      shardIndex: i,
      totalShards: shardCount,
      data: encrypted,  // ← encrypted fragment (for crypto reconstruction)
      checksum,         // ← integrity checksum
      messageHash,     // ← hash of the original message for integrity
      category,
      originNodeId: nodeId,
      location,         // Human readable (e.g. "Sector 7G")
      geo,              // Lat/Lng/Accuracy object
      previousMessageId,
      createdAt: Date.now(),
      expiry: Date.now() + (24 * 60 * 60 * 1000),
      priority,
      trustScore: 1,
      relayCount: 0,
      deviceCount: 1
    });
  }

  return shards;
};

/**
 * Validates a shard's structure and expiry.
 */
export const validateShard = (shard) => {
  if (!shard || !shard.id || !shard.messageId) {
    return { valid: false, error: 'Invalid Structure' };
  }
  if (!shard.data || (!shard.data.cipher && !shard.data.iv)) {
    return { valid: false, error: 'Corrupted Payload' };
  }
  // Checksum Verification
  if (shard.checksum && calculateChecksum(shard.data) !== shard.checksum) {
    return { valid: false, error: 'Checksum Mismatch (Corrupted)' };
  }
  const now = Date.now();
  if (shard.expiry < now) {
    return { valid: false, error: 'Expired Signal' };
  }
  return { valid: true };
};

/**
 * Reconstructs a full message from a collection of shards.
 * NOTE: This is a synchronous version for UI fallback.
 */
export const reconstructMessage = async (shards) => {
  if (!shards || shards.length === 0) return null;
  
  // Sort by index
  const sorted = [...shards].sort((a, b) => a.shardIndex - b.shardIndex);
  const messageId = sorted[0].messageId;
  const expectedHash = sorted[0].messageHash;

  let fullMessage = '';
  for (const shard of sorted) {
    const decrypted = await decryptData(shard.data, messageId);
    if (!decrypted) return null; // Fail if any part is corrupted
    fullMessage += decrypted;
  }

  // Integrity Check
  const actualHash = await calculateHash(fullMessage);
  if (actualHash !== expectedHash) {
    console.error('Integrity Check Failed');
    return null;
  }

  return fullMessage;
};
