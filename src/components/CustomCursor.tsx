import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  const requestRef = useRef<number | undefined>(undefined);
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide default cursor globally
    const style = document.createElement('style');
    style.innerHTML = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
      
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.getAttribute('role') === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[role="button"]')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mouseover', onMouseOver);

    const render = () => {
      // Lerp for smooth trailing (15% closer to target each frame)
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.15;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(render);
    };
    
    requestRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mouseover', onMouseOver);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible]);

  // Only render on client side to avoid hydration mismatch
  if (typeof window === 'undefined') return null;

  return (
    <div 
      className={`pointer-events-none fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Outer Ring Wrapper (Moved by JS) */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ 
          willChange: 'transform',
          transform: 'translate3d(-100px, -100px, 0)' 
        }}
      >
        {/* Inner Ring (Handles hover styles and centering) */}
        <div
          className={`rounded-full border border-primary transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 ${
            isHovering 
              ? 'w-14 h-14 bg-primary/10 border-primary/50' 
              : 'w-8 h-8 bg-transparent border-primary'
          }`}
        />
      </div>
      
      {/* Inner Dot Wrapper (Moved by JS) */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ 
          willChange: 'transform',
          transform: 'translate3d(-100px, -100px, 0)'
        }}
      >
        {/* Inner Dot (Handles hover styles and centering) */}
        <div
          className={`rounded-full bg-primary transition-all duration-300 -translate-x-1/2 -translate-y-1/2 ${
            isHovering ? 'w-1 h-1 opacity-50' : 'w-2 h-2 opacity-100'
          }`}
        />
      </div>
    </div>
  );
}
