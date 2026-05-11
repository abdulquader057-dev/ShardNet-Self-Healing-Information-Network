/**
 * ShardNet TTL Intelligence Utility
 * Manages time-based decay visualization for disaster awareness.
 */

export const getMessageAge = (timestamp) => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

export const getTTLStatus = (timestamp, expiry) => {
  const now = Date.now();
  const total = expiry - timestamp;
  const remaining = expiry - now;
  
  const percentage = Math.max(0, (remaining / total) * 100);
  
  let status = 'fresh';
  let color = 'bg-secondary';
  
  if (percentage < 25) {
    status = 'expired';
    color = 'bg-slate-600 opacity-50';
  } else if (percentage < 60) {
    status = 'aging';
    color = 'bg-amber-500';
  }
  
  return { percentage, status, color };
};

export const isExpired = (expiry) => {
  return Date.now() > expiry;
};
