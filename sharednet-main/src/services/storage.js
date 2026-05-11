import Dexie from 'dexie';

export const db = new Dexie('ShardNetDB');

db.version(1).stores({
  shards: '++id, shardId, messageId, index, totalShards, expiry, priority',
  messages: 'messageId, timestamp, priority, status', // status: 'reconstructing', 'completed', 'failed'
  trust: 'entityId, score, lastUpdated'
});

export const storageService = {
  async saveShard(shard) {
    const existing = await db.shards.where('shardId').equals(shard.shardId).first();
    if (existing) return false;
    await db.shards.add(shard);
    return true;
  },

  async getShardsByMessage(messageId) {
    return await db.shards.where('messageId').equals(messageId).toArray();
  },

  async saveMessage(msg) {
    await db.messages.put(msg);
  },

  async getMessage(messageId) {
    return await db.messages.get(messageId);
  },

  async getAllMessages() {
    return await db.messages.orderBy('timestamp').reverse().toArray();
  },

  async deleteMessage(messageId) {
    await db.messages.delete(messageId);
    await db.shards.where('messageId').equals(messageId).delete();
  },

  async wipe() {
    await db.messages.clear();
    await db.shards.clear();
    await db.trust.clear();
  },

  async cleanupExpired() {
    const now = Date.now();
    await db.shards.where('expiry').below(now).delete();
  }
};
