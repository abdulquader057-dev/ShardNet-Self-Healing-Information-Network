/**
 * ShardNet Trust-by-Density Engine
 * Calculates probabilistic trust based on unique node contributions.
 */

export const calculateTrustLevel = (nodeCount) => {
  if (nodeCount <= 1) return { label: 'Unverified', color: 'text-slate-500', score: 20 };
  if (nodeCount <= 3) return { label: 'Community Seen', color: 'text-amber-500', score: 60 };
  return { label: 'Mesh Verified', color: 'text-secondary', score: 100 };
};

export const getMessageTrust = (message) => {
  // Trust is derived from the number of unique nodes that contributed shards
  // or the overall trustScore accumulated during relay
  const nodes = message.contributingNodes || [];
  const nodeCount = nodes.length;
  
  return calculateTrustLevel(nodeCount);
};

export const updateContributingNodes = (currentNodes, newNodeId) => {
  const nodeSet = new Set(currentNodes || []);
  if (newNodeId) nodeSet.add(newNodeId);
  return Array.from(nodeSet);
};
