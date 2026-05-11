/**
 * ShardNet Bluetooth Mesh Utility
 * Note: Web Bluetooth is primarily for Central (Browser) to Peripheral (Device) comms.
 * This implementation provides the framework for mesh discovery and shard exchange.
 */

export const isBluetoothSupported = () => {
  return 'bluetooth' in navigator;
};

export const discoverDevices = async () => {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth not supported in this browser.');
  }

  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['generic_access'] // Example service
    });
    return device;
  } catch (error) {
    console.error('Discovery failed:', error);
    throw error;
  }
};

export const sendShardsViaBT = async (device, shards) => {
  // In a real implementation, this would connect to a GATT service 
  // and write to a characteristic. Since browser-to-browser GATT 
  // is restricted, we simulate the logic for the P2P layer.
  console.log(`Connecting to ${device.name}...`);
  const server = await device.gatt.connect();
  console.log('Synchronizing shard signatures...');
  
  // Simulation of packet transfer
  const totalSize = JSON.stringify(shards).length;
  return { status: 'success', bytesTransferred: totalSize };
};

export const syncNodes = async (remoteShards, localShards) => {
  const localIds = new Set(localShards.map(s => s.id));
  const missingLocally = remoteShards.filter(s => !localIds.has(s.id));
  
  const remoteIds = new Set(remoteShards.map(s => s.id));
  const missingRemotely = localShards.filter(s => !remoteIds.has(s.id));
  
  return { missingLocally, missingRemotely };
};
