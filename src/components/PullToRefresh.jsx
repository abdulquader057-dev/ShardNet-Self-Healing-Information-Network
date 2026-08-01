import React, { useState, useRef } from 'react';

export default function PullToRefresh({ children, onRefresh }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = (e) => {
    // Trigger only if container is scrolled to the absolute top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].pageY;
    } else {
      startY.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0 || refreshing) return;
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Elastic resistance: 1:0.5 ratio
      const distance = Math.min(diff * 0.5, 120);
      setPullDistance(distance);
      
      // Prevent browser default drag/refresh
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (startY.current === 0 || refreshing) return;
    startY.current = 0;

    if (pullDistance >= 80) {
      setRefreshing(true);
      setPullDistance(80);
      
      // Execute the reload callback
      onRefresh().then(() => {
        setRefreshing(false);
        setPullDistance(0);
      }).catch(() => {
        setRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull down indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-[100]"
          style={{ 
            height: `${pullDistance}px`, 
            top: `-${pullDistance}px`,
            transform: `translateY(${pullDistance}px)`,
            opacity: Math.min(pullDistance / 80, 1),
            transition: startY.current === 0 ? 'height 0.2s, transform 0.2s, opacity 0.2s' : 'none'
          }}
        >
          <div className="bg-[#1C1C1E] border border-slate-800 rounded-full p-2.5 shadow-xl flex items-center justify-center">
            <i 
              className={`ph-bold ph-arrow-counter-clockwise text-[#0A84FF] ${refreshing ? 'animate-spin' : ''}`}
              style={{ 
                fontSize: '20px',
                transform: refreshing ? 'none' : `rotate(${pullDistance * 4.5}deg)`,
                transition: refreshing ? 'none' : 'transform 0.05s'
              }}
            />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
