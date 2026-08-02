import React, { useEffect, useRef } from 'react';

export default function NetworkGraph({ nodeCount = 5, activeCount = 2 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const nodes = [];
    const numNodes = Math.max(3, nodeCount + 2); // Central + some peers

    // Generate random nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        isCenter: i === 0,
        isActive: i <= activeCount
      });
    }

    // Force center node to be in middle
    nodes[0].x = canvas.width / 2;
    nodes[0].y = canvas.height / 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update positions
      nodes.forEach((node, i) => {
        if (!node.isCenter) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
          if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
        }
      });

      // Draw edges
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            const alpha = 1 - dist / 100;
            const isConnectionActive = nodes[i].isActive && nodes[j].isActive;
            ctx.strokeStyle = isConnectionActive ? `rgba(10, 132, 255, ${alpha})` : `rgba(100, 116, 139, ${alpha * 0.5})`;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.isCenter ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = node.isCenter ? '#0A84FF' : (node.isActive ? '#34C759' : '#475569');
        ctx.fill();
        
        if (node.isCenter || node.isActive) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [nodeCount, activeCount]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={120} 
      style={{ width: '100%', height: '120px', borderRadius: '12px' }}
    />
  );
}
