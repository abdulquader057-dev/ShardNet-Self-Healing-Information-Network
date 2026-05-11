/**
 * ShardNet Global Event System (Nuclear Survival Mode)
 * Uses browser-native CustomEvents for absolute reliability.
 */
import { emit, listen } from './eventBus';

export const MESH_EVENTS = {
  SHARD_RECEIVED: 'SHARD_RECEIVED',
  MESSAGE_UPDATED: 'MESSAGE_UPDATED',
  MESSAGE_COMPLETE: 'MESSAGE_COMPLETE',
  SYSTEM_LOG: 'SYSTEM_LOG'
};

export const events = {
  emit,
  listen,
  on: listen // Alias for compatibility
};
