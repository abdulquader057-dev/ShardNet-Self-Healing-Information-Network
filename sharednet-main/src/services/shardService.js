import CryptoJS from 'crypto-js';

export const shardService = {
  /**
   * Split a message into N shards with redundancy.
   * Basic approach: Split into chunks, then distribute chunks across shards.
   */
  createShards(text, priority = 'normal', n = 5, redundancy = 0.4) {
    const messageId = CryptoJS.SHA256(text + Date.now()).toString().substring(0, 16);
    const timestamp = Date.now();
    const expiry = timestamp + (24 * 60 * 60 * 1000); // 24h default

    // Convert message to Base64 to handle any characters
    const encoded = btoa(unescape(encodeURIComponent(text)));
    
    // Split into chunks
    const chunkSize = Math.ceil(encoded.length / n);
    const chunks = [];
    for (let i = 0; i < n; i++) {
      chunks.push(encoded.substring(i * chunkSize, (i + 1) * chunkSize));
    }

    // Generate Shards
    // Each shard stores one chunk and its index
    // For "Self-healing", we could store multiple chunks per shard, 
    // but for this MVP, we'll implement simple chunking.
    const shards = chunks.map((chunk, index) => ({
      shardId: `${messageId}-${index}`,
      messageId,
      index,
      totalShards: n,
      content: chunk,
      checksum: CryptoJS.MD5(chunk).toString(),
      timestamp,
      expiry,
      priority,
    }));

    return { messageId, shards, timestamp };
  },

  /**
   * Attempt to reconstruct a message from available shards.
   */
  reconstruct(shards) {
    if (!shards || shards.length === 0) return null;
    
    const total = shards[0].totalShards;
    const parts = new Array(total).fill(null);
    
    shards.forEach(s => {
      if (s.index < total) {
        // Validate checksum
        const currentChecksum = CryptoJS.MD5(s.content).toString();
        if (currentChecksum === s.checksum) {
          parts[s.index] = s.content;
        }
      }
    });

    const collected = parts.filter(p => p !== null).length;
    const progress = (collected / total) * 100;

    if (collected === total) {
      try {
        const fullEncoded = parts.join('');
        const decoded = decodeURIComponent(escape(atob(fullEncoded)));
        return { success: true, content: decoded, progress: 100 };
      } catch (e) {
        return { success: false, error: 'Decoding failed', progress: 100 };
      }
    }

    return { success: false, progress, collected, total };
  }
};
