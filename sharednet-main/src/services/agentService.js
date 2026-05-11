export const agentService = {
  getPriorityLevel(priority) {
    const weights = {
      emergency: 3,
      important: 2,
      normal: 1
    };
    return weights[priority] || 0;
  },

  analyzeNetwork(messages, shards) {
    const suggestions = [];
    
    messages.forEach(msg => {
      if (msg.status === 'in-progress') {
        const msgShards = shards.filter(s => s.messageId === msg.messageId);
        const totalReq = msgShards[0]?.totalShards || 5;
        const progress = (msgShards.length / totalReq) * 100;
        
        if (progress >= 60) {
          suggestions.push({
            id: `near-${msg.messageId}`,
            type: 'near-complete',
            message: `Message ${msg.messageId.substring(0, 4)} is almost recovered (${Math.round(progress)}%)`,
            priority: msg.priority
          });
        }
      }
      
      if (msg.priority === 'emergency' && msg.status === 'completed') {
        suggestions.push({
          id: `emerg-${msg.messageId}`,
          type: 'emergency',
          message: `URGENT BROADCAST: Priority data active.`,
          priority: 'emergency'
        });
      }
    });

    return suggestions;
  }
};
