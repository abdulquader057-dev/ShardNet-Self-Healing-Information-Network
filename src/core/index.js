/**
 * ShardNet Core Engine
 * Unified entry point for the self-healing message ecosystem.
 */

import { events, MESH_EVENTS } from './events';
import { messageManager } from './messageManager';
import { 
  createShards, 
  validateShard, 
  reconstructMessage,
  calculateHash,
  calculateChecksum
} from './sharding';

export {
  events,
  MESH_EVENTS,
  messageManager,
  createShards,
  validateShard,
  reconstructMessage,
  calculateHash,
  calculateChecksum
};

// Initialize the background manager
messageManager.init();
