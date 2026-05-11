/**
 * Signal Ghost Engine - Passive Rebroadcasting
 * Objective: Stable, battery-efficient relaying
 */
import { getAllMessages } from '../storage/db';
import { safeInterval, isLowBattery, safeInit } from '../core/stability';
import { events, MESH_EVENTS } from '../core/events';

let stopLoop = null;
export let isGhostActive = false;

export const startGhostEngine = () => {
  if (isGhostActive) return;
  isGhostActive = true;

  const cycle = async () => {
    // 🔋 BATTERY HIBERNATION: If battery < 10%, stop passive relay
    const lowBattery = await isLowBattery();
    if (lowBattery) return;

    try {
      const msgs = await getAllMessages();
      const validMsgs = msgs.filter(m => m.message);
      if (validMsgs.length === 0) return;

      // Pick highest priority message to rebroadcast
      const highestPriority = validMsgs.sort((a,b) => b.priority - a.priority)[0];
      
      // Emit relay event (Safe event bus)
      events.emit('GHOST_RELAY', { 
        id: highestPriority.messageId, 
        priority: highestPriority.priority,
        timestamp: Date.now()
      });

    } catch (e) {
      console.warn("Ghost Engine Cycle Failure", e);
    }
  };

  // Run with safe interval (auto-adjusts for low power)
  stopLoop = safeInterval(cycle, 30000); 
};

export const stopGhostEngine = () => {
  isGhostActive = false;
  if (stopLoop) stopLoop();
};
