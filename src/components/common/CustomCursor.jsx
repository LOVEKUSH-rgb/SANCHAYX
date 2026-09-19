import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoverState, setHoverState] = useState('default'); // 'default' | 'interactive' | 'hidden'
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Use refs for the animation loop to avoid stale closures
  const hoverStateRef = useRef('default');
  const isVisibleRef = useRef(false);

  // Mouse real position
  const mousePos = useRef({ x: -100, y: -100 });
  // Core dot position
  const dotPos = useRef({ x: -100, y: -100 });
  // Outer glow position (smooth trailing)
  const glowPos = useRef({ x: -100, y: -100 });

  // DOM element refs
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // 1. Responsive check: Disable custom cursor on touch / coarse pointer devices
    const touchQuery = window.matchMedia('(pointer: coarse), (hover: none)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (touchQuery.matches || ('ontouchstart' in window && window.innerWidth < 1024)) {
      setIsTouchDevice(true);
      return;
    }

    const handleTouchChange = (e) => setIsTouchDevice(e.matches);
    touchQuery.addEventListener('change', handleTouchChange);

    // 2. Mouse movement & visibility listeners
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };
    const onMouseLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };
    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);

    // 3. Hover state detection via document delegation
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement)) return;

      const interactiveEl = target.closest('button, a, .btn, [role="button"], [role="link"], input[type="submit"], input[type="button"], .card, article, [data-cursor="interactive"]');
      const hiddenEl = target.closest('input:not([type="submit"]):not([type="button"]), textarea, [contenteditable="true"]');

      let newState = 'default';
      
      if (hiddenEl) {
        newState = 'hidden';
      } else if (interactiveEl) {
        newState = 'interactive';
      }

      if (hoverStateRef.current !== newState) {
        hoverStateRef.current = newState;
        setHoverState(newState);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver, { passive: true });

    // 4. Animation loop with smooth 50-100ms physics
    const render = () => {
      const reducedMotion = motionQuery.matches;

      if (reducedMotion) {
        // Immediate position without trailing physics
        dotPos.current = { ...mousePos.current };
        glowPos.current = { ...mousePos.current };
      } else {
        // Core dot lerp factor ~0.35 (snappy)
        dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.35;
        dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.35;

        // Outer glow lerp factor ~0.15 (soft floating trailing effect)
        glowPos.current.x += (mousePos.current.x - glowPos.current.x) * 0.15;
        glowPos.current.y += (mousePos.current.y - glowPos.current.y) * 0.15;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glowPos.current.x}px, ${glowPos.current.y}px, 0)`;
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      touchQuery.removeEventListener('change', handleTouchChange);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', onMouseOver);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Don't render on mobile / touch devices
  if (isTouchDevice) return null;

  // Determine dynamic size & styling classes based on hoverState & mouseDown
  // Normal state: ~32px (w-8 h-8)
  let glowClasses = 'w-8 h-8 border border-sanchay-emerald-500/40 bg-sanchay-emerald-500/10 shadow-[0_0_10px_rgba(5,150,105,0.2)] opacity-100';
  let dotClasses = 'w-1.5 h-1.5 bg-sanchay-emerald-600 shadow-[0_0_6px_rgba(5,150,105,0.5)] opacity-100';
  let glowScale = 'scale-100';

  if (isMouseDown) {
    glowScale = 'scale-90 opacity-80';
  } else if (hoverState === 'interactive') {
    // Interactive state: ~44px (w-11 h-11)
    glowClasses = 'w-11 h-11 border-2 border-sanchay-emerald-500/60 bg-sanchay-emerald-500/20 shadow-[0_0_15px_rgba(5,150,105,0.3)] opacity-100';
    dotClasses = 'w-1.5 h-1.5 bg-sanchay-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.8)] opacity-100';
    glowScale = 'scale-110';
  } else if (hoverState === 'hidden') {
    glowClasses = 'w-8 h-8 opacity-0';
    dotClasses = 'w-1.5 h-1.5 opacity-0';
  }

  // Hide entirely if user requested reduced motion
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        (isVisible && !isReduced) ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Outer Floating Soft Glow Ring */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out ${glowClasses} ${glowScale}`} />
      </div>

      {/* Main Core Dot */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div className={`-translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ease-out ${dotClasses}`} />
      </div>
    </div>
  );
};
