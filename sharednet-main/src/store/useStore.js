import { create } from 'zustand';
import { db, storageService } from '../services/storage';
import { shardService } from '../services/shardService';

export const useStore = create((set, get) => ({
  messages: [],
  shards: [],
  loading: true,

  init: async () => {
    await storageService.cleanupExpired();
    const messages = await storageService.getAllMessages();
    const shards = await db.shards.toArray();
    set({ messages, shards, loading: false });
  },

  addShard: async (shard) => {
    const isNew = await storageService.saveShard(shard);
    
    // Check for message metadata - even if shard exists, we might want to trigger reconstruction
    let msg = await storageService.getMessage(shard.messageId);
    if (!msg) {
      msg = {
        messageId: shard.messageId,
        timestamp: shard.timestamp,
        priority: shard.priority,
        status: 'in-progress',
        content: null
      };
      await storageService.saveMessage(msg);
    }

    // Try reconstruction
    const messageShards = await storageService.getShardsByMessage(shard.messageId);
    const result = shardService.reconstruct(messageShards);

    if (result.success && msg.status !== 'completed') {
      msg.status = 'completed';
      msg.content = result.content;
      await storageService.saveMessage(msg);
    }

    const messages = await storageService.getAllMessages();
    const shards = await db.shards.toArray();
    set({ messages, shards });
  },

  createMessage: async (text, priority, n = 5) => {
    const { shards, messageId, timestamp } = shardService.createShards(text, priority, n);
    
    // Save metadata
    await storageService.saveMessage({
      messageId,
      timestamp,
      priority,
      status: 'completed',
      content: text
    });

    // Save shards locally
    for (const s of shards) {
      await storageService.saveShard(s);
    }

    const messages = await storageService.getAllMessages();
    const allShards = await db.shards.toArray();
    set({ messages, shards: allShards });
    return { shards, messageId };
  },

  wipeData: async () => {
    await storageService.wipe();
    localStorage.clear();
    set({ messages: [], shards: [] });
  },

  deleteMessage: async (id) => {
    await storageService.deleteMessage(id);
    const messages = await storageService.getAllMessages();
    const shards = await db.shards.toArray();
    set({ messages, shards });
  }
}));
