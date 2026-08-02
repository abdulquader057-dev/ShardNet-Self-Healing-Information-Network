import * as DexieModule from 'dexie';
const Dexie = DexieModule.default || DexieModule;
import { events, MESH_EVENTS } from '../core/events';
import { encryptData, decryptData, calculateHash } from '../core/sharding';

let activeVaultKey = null; // Stays in memory only

// 1. Define the Mock Store Factory first to avoid temporal dead zone
const createMockStore = (name) => {
  const getStore = () => {
    try {
      return JSON.parse(sessionStorage.getItem(`mock_${name}`) || '[]');
    } catch(e) { return []; }
  };
  const setStore = (data) => {
    try {
      sessionStorage.setItem(`mock_${name}`, JSON.stringify(data));
    } catch(e) {}
  };
  
  return {
    put: async (item) => {
      const store = getStore();
      const idx = store.findIndex(x => (x.id && x.id === item.id) || (x.messageId && x.messageId === item.messageId));
      if (idx >= 0) store[idx] = item; else store.push(item);
      setStore(store);
      return item.id || item.messageId;
    },
    get: async (id) => getStore().find(x => x.id === id || x.messageId === id),
    toArray: async () => getStore(),
    count: async () => getStore().length,
    add: async (item) => {
      const store = getStore();
      const id = item.id || Date.now() + Math.random();
      store.push({ ...item, id });
      setStore(store);
      return id;
    },
    clear: async () => sessionStorage.removeItem(`mock_${name}`),
    delete: async (id) => {
      const store = getStore();
      setStore(store.filter(x => x.id !== id && x.messageId !== id));
    },
    orderBy: (prop) => ({
      first: async () => {
         const s = getStore().sort((a,b) => a[prop] - b[prop]);
         return s[0];
      },
      reverse: () => ({
        limit: (n) => ({ toArray: async () => getStore().sort((a,b) => b[prop] - a[prop]).slice(0, n) })
      }),
      limit: (n) => ({ toArray: async () => getStore().sort((a,b) => a[prop] - b[prop]).slice(0, n) })
    }),
    where: (prop) => ({
      equals: (val) => ({ toArray: async () => getStore().filter(x => x[prop] === val) }),
      below: (val) => ({ delete: async () => {
        const store = getStore();
        const keep = store.filter(x => x[prop] >= val);
        setStore(keep);
        return store.length - keep.length;
      }})
    }),
    update: async (id, changes) => {
      const store = getStore();
      const idx = store.findIndex(x => (x.id === id) || (x.messageId === id));
      if (idx >= 0) {
        store[idx] = { ...store[idx], ...changes };
        setStore(store);
        return 1;
      }
      return 0;
    }
  };
};

// 2. Initialize with Mock by default (Guaranteed non-null)
let db = {
  shards: createMockStore('shards'),
  messages: createMockStore('messages'),
  logs: createMockStore('logs'),
  settings: createMockStore('settings'),
  history: createMockStore('history'),
  contacts: createMockStore('contacts'),
  forum: createMockStore('forum'),
  emergencyContacts: createMockStore('emergencyContacts'),
  evidence: createMockStore('evidence'),
  open: async () => { console.log("Mock DB Open"); },
  version: () => ({ stores: () => {} }) // Mock Dexie versioning
};

// 3. Attempt to upgrade to real Dexie if available
try {
  if (typeof Dexie === 'function' || (Dexie && Dexie.default)) {
    const D = Dexie.default || Dexie;
    const realDb = new D('ShardNetDB');
    realDb.version(12).stores({
      shards: 'id, messageId, shardIndex, expiry, createdAt, trustScore, nodeId, priority, location, relayCount, deviceCount',
      messages: 'messageId, reconstructedAt, shardCount, priority, previousMessageId, category, lifecycle, usefulness, lastInteraction, location, impact, *contributingNodes, consensusHash, *witnessNodes',
      logs: '++id, timestamp, type, message',
      settings: 'id, value',
      history: '++id, timestamp, type, data',
      contacts: 'nodeId, alias, addedAt, lastSeen',
      forum: 'id, timestamp, authorNodeId, authorAlias, content, category, ttl, receivedAt',
      squads: 'name, secretKey, addedAt',
      mapTiles: 'url, data, timestamp',
      emergencyContacts: '++id, name, phone',
      evidence: 'id, type, category, timestamp, ttl'
    });
    db = realDb; // Swap to real DB
  }
} catch (e) {
  console.warn("🛡️ DB_SHIELD: Failed to instantiate Dexie, keeping mock.", e);
}

export { db };
export let isStoragePersistent = true;

export const globalInit = async () => {
  try {
    if (db && typeof db.open === 'function') {
      await db.open();
      isStoragePersistent = true;
      console.log("🛡️ DB_SHIELD: IndexedDB Engine Ready");
      return;
    }
  } catch (err) {
    console.warn("🛡️ DB_SHIELD: IndexedDB locked. Using session fallback.");
    isStoragePersistent = false;
  }
};


export const USEFULNESS = {
  RELEVANT: 'Relevant',
  OUTDATED: 'Outdated',
  NOT_USEFUL: 'Not Useful'
};

export const LIFECYCLE = {
  CREATED: 'Created',
  PROPAGATING: 'Propagating',
  PARTIAL: 'Partially Available',
  READY: 'Ready for Reconstruction',
  FULL: 'Fully Reconstructed',
  EXPIRED: 'Expired'
};

export const getMessageLifecycle = async (messageId) => {
  const shards = await getShardsByMessageId(messageId);
  const message = await db.messages.get(messageId);
  
  if (shards.length === 0) return 'Unknown';
  
  const now = Date.now();
  if (shards.every(s => s.expiry < now)) return LIFECYCLE.EXPIRED;
  
  if (message) return LIFECYCLE.FULL;
  
  const total = shards[0].totalShards;
  if (shards.length === total) return LIFECYCLE.READY;
  
  const isPropagating = shards.some(s => (s.relayCount || 0) > 0);
  if (isPropagating) return LIFECYCLE.PROPAGATING;
  
  return LIFECYCLE.PARTIAL;
};

const SHARD_LIMIT = 100;

export const saveShard = async (shard) => {
  // Enforce storage limits
  const count = await db.shards.count();
  if (count >= SHARD_LIMIT) {
    const oldest = await db.shards.orderBy('createdAt').first();
    if (oldest) await db.shards.delete(oldest.id);
  }

  const existing = await db.shards.get(shard.id);
  if (existing) {
    const newTrust = (existing.trustScore || 1) + 1;
    const newRelays = (existing.relayCount || 0) + 1;
    const newDevices = (existing.deviceCount || 1) + (shard.newDevice ? 1 : 0);
    
    await db.shards.update(shard.id, { 
      trustScore: newTrust,
      relayCount: newRelays,
      deviceCount: newDevices
    });
    
    await addLog(`Signal verified. Trust: ${newTrust} | Relays: ${newRelays}`, 'info');
    return { status: 'duplicate', shard: { ...existing, trustScore: newTrust } };
  }
  
  const shardToSave = {
    ...shard,
    trustScore: shard.trustScore || 1,
    relayCount: shard.relayCount || 1,
    deviceCount: shard.deviceCount || 1,
    nodeId: shard.nodeId || 'unknown',
    priority: shard.priority || 1,
    location: shard.location || 'Unknown Sector'
  };
  
  await db.shards.put(shardToSave);
  await addToHistory('scan', shardToSave);
  await addLog(`Captured fragment ${shard.shardIndex + 1}/${shard.totalShards} [ID: ${shard.messageId.substring(0, 6)}]`, 'success');
  
  events.emit(MESH_EVENTS.SHARD_RECEIVED, shardToSave);
  return { status: 'success', shard: shardToSave };
};

export const addToHistory = async (type, data) => {
  return await db.history.add({
    timestamp: Date.now(),
    type,
    data
  });
};

export const getHistory = async (limit = 10) => {
  return await db.history.orderBy('timestamp').reverse().limit(limit).toArray();
};

export const addLog = async (message, type = 'info') => {
  return await db.logs.add({
    timestamp: Date.now(),
    type,
    message
  });
};

export const getLogs = async (limit = 20) => {
  return await db.logs.orderBy('timestamp').reverse().limit(limit).toArray();
};

export const getAllShards = async () => {
  return await db.shards.toArray();
};

export const getShardsByMessageId = async (messageId) => {
  return await db.shards.where('messageId').equals(messageId).toArray();
};

export const deleteExpiredShards = async () => {
  const now = Date.now();
  return await db.shards.where('expiry').below(now).delete();
};

export const clearAllData = async () => {
  await db.shards.clear();
  await db.messages.clear();
};

export const setVaultKey = async (key) => { 
  activeVaultKey = key; 
  if (!localStorage.getItem('vaultTest')) {
    const test = await encryptData("VAULT_TEST", key);
    localStorage.setItem('vaultTest', JSON.stringify(test));
  }
};
export const verifyVaultKey = async (key) => {
  const testStr = localStorage.getItem('vaultTest');
  if (!testStr) return true; // No key set yet
  try {
    const testObj = JSON.parse(testStr);
    const decrypted = await decryptData(testObj, key);
    return decrypted === "VAULT_TEST";
  } catch (e) {
    return false;
  }
};
export const clearVaultKey = () => { activeVaultKey = null; };
export const isVaultLocked = () => !activeVaultKey;

export const saveMessage = async (messageData) => {
  const existing = await db.messages.get(messageData.messageId);
  const shards = await getShardsByMessageId(messageData.messageId);
  
  // Intelligence: Extract unique contributing nodes
  const contributingNodes = Array.from(new Set(shards.map(s => s.originNodeId)));

  let encryptedMessage = messageData.message;
  let isStealth = false;

  // If a vault key is active, encrypt the message string before saving
  if (activeVaultKey) {
    const encrypted = await encryptData(messageData.message, activeVaultKey);
    encryptedMessage = JSON.stringify(encrypted);
    isStealth = true;
  }

  const messageToSave = {
    ...messageData,
    message: encryptedMessage,
    isStealth,
    contributingNodes,
    usefulness: existing?.usefulness || USEFULNESS.RELEVANT,
    lastInteraction: Date.now(),
    impact: messageData.impact || { deviceCount: messageData.deviceCount || 1, relayCount: messageData.relayCount || 0 }
  };
  
  await db.messages.put(messageToSave);
  await addToHistory('alert', messageToSave);
  
  // ECR: Register local reconstruction for consensus tracking
  const nodeId = await getNodeIdentity();
  const hash = await calculateHash(messageData.message);
  
  const witnessNodes = new Set(existing?.witnessNodes || []);
  witnessNodes.add(nodeId);
  
  messageToSave.consensusHash = hash;
  messageToSave.witnessNodes = Array.from(witnessNodes);
  
  await db.messages.put(messageToSave);
  events.emit(MESH_EVENTS.MESSAGE_COMPLETE, messageToSave);
  return messageToSave;
};

export const updateMessageUsefulness = async (messageId, usefulness) => {
  const updateData = { usefulness, lastInteraction: Date.now() };
  
  // If marked as outdated or not useful, reduce TTL of its shards
  if (usefulness !== USEFULNESS.RELEVANT) {
    const shards = await getShardsByMessageId(messageId);
    for (const s of shards) {
      const newExpiry = Date.now() + 60000; // Expire in 1 minute
      await db.shards.update(s.id, { expiry: newExpiry });
    }
    await addLog(`Message ${messageId.substring(0, 8)} de-prioritized. Fragments expiring soon.`, 'info');
  }

  return await db.messages.update(messageId, updateData);
};

export const performSelfHealing = async () => {
  const now = Date.now();
  
  // 1. Remove expired shards
  const expiredCount = await db.shards.where('expiry').below(now).delete();
  
  // 2. Remove messages that have no shards left and are old
  const allMessages = await db.messages.toArray();
  let cleanedMessages = 0;
  for (const msg of allMessages) {
    const shards = await getShardsByMessageId(msg.messageId);
    if (shards.length === 0 && (now - msg.lastInteraction) > 3600000) { // 1 hour inactivity
      await db.messages.delete(msg.messageId);
      cleanedMessages++;
    }
  }

  // 3. Storage optimization: keep only top 100 shards
  const shardCount = await db.shards.count();
  if (shardCount > 100) {
    const overflow = shardCount - 100;
    const oldest = await db.shards.orderBy('createdAt').limit(overflow).toArray();
    for (const s of oldest) await db.shards.delete(s.id);
  }

  // 4. Auto-purge evidence after TTL + 24h
  const evidences = await db.evidence.toArray();
  let purgedEvidence = 0;
  for (const ev of evidences) {
    if (ev.ttl) {
      const ttlMs = ev.ttl * 3600000;
      const gracePeriod = 86400000; // 24 hours
      if (now > (ev.timestamp + ttlMs + gracePeriod)) {
        await db.evidence.delete(ev.id);
        purgedEvidence++;
      }
    }
  }

  if (expiredCount > 0 || cleanedMessages > 0 || purgedEvidence > 0) {
    await addLog(`Self-healing active: Purged ${expiredCount} expired signals, ${cleanedMessages} inactive records, and ${purgedEvidence} old evidence items.`, 'success');
  }
};

export const getAllMessages = async () => {
  const messages = await db.messages.toArray();
  
  // Decrypt stealth messages if key is available
  return await Promise.all(messages.map(async m => {
    if (m.isStealth && activeVaultKey) {
      try {
        const payload = typeof m.message === 'string' ? JSON.parse(m.message) : m.message;
        const decrypted = await decryptData(payload, activeVaultKey);
        return { ...m, message: decrypted || '[DECRYPTION FAILED]' };
      } catch (e) {
        return { ...m, message: m.message || '[LOCKED]' };
      }
    }
    if (m.isStealth && !activeVaultKey) {
      return { ...m, message: '[LOCKED]' };
    }
    return m;
  }));
};

export const getNodeIdentity = async () => {
  let node = await db.settings.get('node_identity');
  if (!node) {
    const newId = `Node-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    node = { id: 'node_identity', value: newId };
    await db.settings.put(node);
  }
  return node.value;
};

export const getSetting = async (key, defaultValue) => {
  const setting = await db.settings.get(key);
  return setting ? setting.value : defaultValue;
};

export const setSetting = async (key, value) => {
  return await db.settings.put({ id: key, value });
};

