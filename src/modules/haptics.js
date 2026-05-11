/**
 * Haptic Engine - Centralized vibration patterns
 */
export const Haptics = {
  vibrate: (pattern) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore haptic errors
      }
    }
  },
  
  shardReceived: () => Haptics.vibrate(50),
  messageComplete: () => Haptics.vibrate([100, 50, 200]),
  sosNearby: () => Haptics.vibrate([50, 50, 50, 50, 50, 50]),
  error: () => Haptics.vibrate([200, 100, 200]),
  success: () => Haptics.vibrate([100, 50, 100]),
  tap: () => Haptics.vibrate(30)
};

// Global event listeners for haptics
if (typeof window !== 'undefined') {
  window.addEventListener('shardReceived', Haptics.shardReceived);
  window.addEventListener('messageComplete', Haptics.messageComplete);
  window.addEventListener('sosNearby', Haptics.sosNearby);
}
