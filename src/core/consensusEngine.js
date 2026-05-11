import { db } from '../storage/db';
import { calculateHash } from './sharding';

/**
 * Emergency Consensus Reconstruction (ECR) Layer
 * Probabilistic trust validation based on independent agreement.
 */

/**
 * Generates a consensus fingerprint for a reconstructed message.
 */
export const generateConsensusHash = async (messageText) => {
  return await calculateHash(messageText);
};

/**
 * Registers a local reconstruction and checks for existing consensus.
 */
export const registerLocalReconstruction = async (messageId, messageText, nodeId) => {
  const hash = await generateConsensusHash(messageText);
  
  const existing = await db.messages.get(messageId);
  if (existing) {
    const witnessNodes = new Set(existing.witnessNodes || []);
    witnessNodes.add(nodeId);
    
    await db.messages.update(messageId, {
      consensusHash: hash,
      witnessNodes: Array.from(witnessNodes)
    });
  }
};

/**
 * Ingests a witness proof from a peer (e.g., via Mesh Pulse).
 * @param {string} messageId 
 * @param {string} peerHash 
 * @param {string} peerNodeId 
 */
export const addWitnessProof = async (messageId, peerHash, peerNodeId) => {
  const local = await db.messages.get(messageId);
  if (!local) return; // We haven't reconstructed this yet, so we can't verify

  if (local.consensusHash === peerHash) {
    const witnesses = new Set(local.witnessNodes || []);
    witnesses.add(peerNodeId);
    
    await db.messages.update(messageId, {
      witnessNodes: Array.from(witnesses)
    });
    
    return true; // Agreement found
  }
  
  return false; // Mismatch!
};

/**
 * Returns the consensus status for a message.
 */
export const getConsensusStatus = (message) => {
  const witnessCount = (message.witnessNodes || []).length;
  
  if (witnessCount >= 3) return 'verified';   // 3+ independent devices agree
  if (witnessCount >= 2) return 'confirmed';  // 2 devices agree
  if (witnessCount === 1) return 'pending';    // Only local device
  return 'unverified';
};
