import QRCode from 'qrcode';

/**
 * Maps long shard keys to short aliases to reduce QR data density.
 */
const KEY_MAP = {
  messageId: 'm',
  shardIndex: 'i',
  totalShards: 't',
  data: 'd',
  cipher: 'c',
  iv: 'v',
  checksum: 'k',
  messageHash: 'h',
  category: 'y',
  originNodeId: 'n',
  location: 'l',
  geo: 'g',
  lat: 'a',
  lng: 'o',
  accuracy: 'r',
  createdAt: 'e',
  expiry: 'x',
  priority: 'p'
};

const REVERSE_MAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]));

const compress = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = KEY_MAP[k] || k;
    result[key] = typeof v === 'object' ? compress(v) : v;
  }
  return result;
};

const expand = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [v, val] of Object.entries(obj)) {
    const key = REVERSE_MAP[v] || v;
    result[key] = typeof val === 'object' ? expand(val) : val;
  }
  return result;
};

/**
 * Generates a Data URL for a QR code from a shard object.
 * @param {Object} shard 
 * @returns {Promise<string>}
 */
export const generateShardQR = async (shard) => {
  try {
    // Use compressed keys to keep the QR code "light" and easy to scan
    const compressed = compress(shard);
    const jsonString = JSON.stringify(compressed);
    
    // Use a custom scheme to save even more URL space
    const deepLink = `sn://s?d=${encodeURIComponent(jsonString)}`;
    
    return await QRCode.toDataURL(deepLink, {
      errorCorrectionLevel: 'L',
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#16161a',
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

/**
 * Generates a Data URL for a bundle of shards.
 * @param {Array} shards 
 * @returns {Promise<string>}
 */
export const generateBundleQR = async (shards) => {
  try {
    const bundle = {
      type: 'b', // 'b' for bundle
      data: shards.map(s => compress(s))
    };
    const jsonString = JSON.stringify(bundle);
    const deepLink = `sn://b?d=${encodeURIComponent(jsonString)}`;
    
    return await QRCode.toDataURL(deepLink, {
      errorCorrectionLevel: 'L', 
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#16161a',
      },
    });
  } catch (err) {
    console.error('Error generating bundle QR code:', err);
    throw err;
  }
};

export const parseShardQR = (qrData) => {
  try {
    let payload = qrData;
    
    // Handle custom sn:// scheme or legacy http/https links
    if (qrData.startsWith('sn://') || qrData.startsWith('http')) {
      const url = new URL(qrData.replace('sn://', 'http://'));
      const dataParam = url.searchParams.get('d') || url.searchParams.get('data');
      if (dataParam) {
        payload = decodeURIComponent(dataParam);
      }
    }

    const parsed = JSON.parse(payload);
    
    // Check if it's a bundle or mesh pulse (handle both compressed and legacy)
    if (parsed.type === 'shard_bundle' || parsed.type === 'mesh_pulse' || parsed.type === 'b') {
      const rawShards = parsed.type === 'mesh_pulse' ? parsed.payload : (parsed.data || parsed.payload);
      const shards = rawShards.map(s => s.m ? expand(s) : s); // Expand if compressed
      return { type: 'bundle', shards };
    }

    // Single shard check (handle compressed first)
    if (parsed.m && parsed.i !== undefined) {
      return { type: 'shard', shard: expand(parsed) };
    }
    
    // Legacy single shard
    if (parsed.messageId && parsed.shardIndex !== undefined) {
      return { type: 'shard', shard: parsed };
    }
    return null;
  } catch (err) {
    console.error('Error parsing QR data:', err);
    return null;
  }
};

export const getTrustLevel = (score = 1, relays = 0, devices = 1) => {
  const composite = score + (relays * 0.5) + (devices * 2);
  
  if (composite >= 12) return { label: 'HIGH', color: 'text-emerald-500' };
  if (composite >= 5) return { label: 'MEDIUM', color: 'text-blue-500' };
  return { label: 'LOW', color: 'text-amber-500' };
};

export const getCategoryStyle = (category) => {
  const styles = {
    'Emergency': 'bg-danger/20 text-danger border-danger/30',
    'Safe Route': 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    'Medical': 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    'Info': 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };
  return styles[category] || styles['Info'];
};
