/**
 * ShardNet Proximity Sharing Utility
 * Uses the Web Share API to bridge to OS-level offline transfer (Nearby Share / AirDrop)
 */

export const isSharingSupported = () => {
  return !!navigator.share;
};

/**
 * Beams a shard or bundle to nearby devices using native OS sharing.
 * This triggers Bluetooth/Wi-Fi Direct transfers on compatible devices.
 */
export const beamSignal = async (data, label = 'Emergency Signal') => {
  if (!isSharingSupported()) {
    throw new Error('Native proximity sharing not supported on this device.');
  }

  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    
    // We share as a text blob. On Android/iOS, this triggers Nearby Share/AirDrop
    await navigator.share({
      title: `ShardNet: ${label}`,
      text: payload,
      // For better compatibility with local file transfer, we can also send as a .json file
      // but text is the most universal "unbreakable" format.
    });
    
    return { status: 'success' };
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Beam failed:', error);
      throw error;
    }
    return { status: 'cancelled' };
  }
};

/**
 * Shares a base64 image as a native file (Required for mobile AirDrop/Nearby Share)
 */
export const shareImage = async (dataUrl, filename = 'shard.png') => {
  if (!navigator.canShare) {
    throw new Error('Native file sharing not supported.');
  }

  try {
    // Manually convert base64 to Blob (more robust than fetch for data URLs)
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], {type:mime});
    const file = new File([blob], filename, { type: mime });

    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'SharedNet Shard',
        text: 'Encrypted intelligence fragment'
      });
      return { status: 'success' };
    } else {
      // Fallback to text sharing if file sharing fails
      await navigator.share({
        title: 'SharedNet Shard',
        text: dataUrl
      });
      return { status: 'success' };
    }
  } catch (error) {
    if (error.name !== 'AbortError') throw error;
    return { status: 'cancelled' };
  }
};

/**
 * Force downloads a base64 image
 */
export const downloadImage = (dataUrl, filename = 'shard.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a "Mesh Link" for manual sharing (Copy/Paste)
 */
export const generateMeshLink = (data) => {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const encoded = encodeURIComponent(payload);
  const base = window.location.origin + window.location.pathname;
  return `${base}?data=${encoded}`;
};
