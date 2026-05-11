import { events, MESH_EVENTS } from './events';
import { getShardsByMessageId, saveMessage, db } from '../storage/db';
import { reconstructMessage } from './sharding';
import { safeInit } from './stability';

/**
 * MessageManager: The brain of the shard lifecycle.
 */

const processing = new Set();

export const messageManager = {
  init: () => {
    safeInit("Message Manager Events", () => {
      // Listen for incoming shards
      events.on(MESH_EVENTS.SHARD_RECEIVED, async (shard) => {
        await messageManager.evaluateReconstruction(shard.messageId);
      });
    });
  },

  evaluateReconstruction: async (messageId) => {
    if (processing.has(messageId)) return;
    
    try {
      processing.add(messageId);
      
      const existing = await db.messages.get(messageId);
      if (existing) return;

      const shards = await getShardsByMessageId(messageId);
      if (!shards || shards.length === 0) return;

      const threshold = shards[0].totalShards;
      
      if (shards.length >= threshold) {
        const fullMessage = await reconstructMessage(shards);
        
        if (fullMessage) {
          const finalMsg = await saveMessage({
            messageId,
            message: fullMessage,
            category: shards[0].category,
            location: shards[0].location,
            geo: shards[0].geo,
            originNodeId: shards[0].originNodeId,
            reconstructedAt: Date.now(),
            priority: shards[0].priority,
            trustScore: shards.reduce((acc, s) => acc + s.trustScore, 0)
          });
          
          events.emit(MESH_EVENTS.MESSAGE_COMPLETE, finalMsg);
        }
      } else {
        events.emit(MESH_EVENTS.MESSAGE_UPDATED, { 
          messageId, 
          received: shards.length, 
          total: threshold 
        });
      }
    } catch (err) {
      console.error('[Auto-Recon] Failure:', err);
    } finally {
      processing.delete(messageId);
    }
  }
};
