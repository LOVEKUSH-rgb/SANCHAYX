import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoverState, setHoverState] = useState('default'); // 'default' | 'button' | 'card' | 'link' | 'sakhi'
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Mouse real position
  const mousePos = useRef({ x: -100, y: -100 });
  // Core dot position (snappy trailing)
  const dotPos = useRef({ x: -100, y: -100 });
  // Outer glow position (softer, 50-100ms smooth trailing float effect)
  const glowPos = useRef({ x: -100, y: -100 });
  // Currently hovered link element ref for magnetic pull
  const hoveredElementRef = useRef(null);

  // DOM element refs
  const dotRef = useRef(null);
  const glowRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    // 1. Responsive check: Disable custom cursor on touch / coarse pointer devices
    const touchQuery = window.matchMedia('(pointer: coarse)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (touchQuery.matches || ('ontouchstart' in window && window.innerWidth < 768)) {
      setIsTouchDevice(true);
      return;
    }

    const handleTouchChange = (e) => setIsTouchDevice(e.matches);
    touchQuery.addEventListener('change', handleTouchChange);

    // 2. Mouse movement & visibility listeners
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);

    // 3. Hover state detection via document delegation
    const onMouseOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement)) return;

      const sakhiEl = target.closest('[data-cursor="sakhi"], .sakhi-avatar, [aria-label*="Sakhi"]');
      const buttonEl = target.closest('button, .btn, [role="button"], input[type="submit"], input[type="button"], [data-cursor="button"]');
      const linkEl = target.closest('a, nav a, [data-cursor="link"], [role="link"]');
      const cardEl = target.closest('.card, [data-cursor="card"], article, .shadow-card, .shadow-floating, .shadow-editorial');

      if (sakhiEl) {
        setHoverState('sakhi');
        hoveredElementRef.current = sakhiEl;
      } else if (buttonEl) {
        setHoverState('button');
        hoveredElementRef.current = buttonEl;
      } else if (linkEl) {
        setHoverState('link');
        hoveredElementRef.current = linkEl;
      } else if (cardEl) {
        setHoverState('card');
        hoveredElementRef.current = cardEl;
      } else {
        setHoverState('default');
        hoveredElementRef.current = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseenter', onMouseEnter);
    window.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', onMouseOver, { passive: true });

    // 4. Animation loop with smooth 50-100ms physics & optional magnetic pull for links
    const render = () => {
      const reducedMotion = motionQuery.matches;

      let targetGlowX = mousePos.current.x;
      let targetGlowY = mousePos.current.y;

      // Magnetic floating pull towards links/navigation items
      if (hoverState === 'link' && hoveredElementRef.current) {
        const rect = hoveredElementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        targetGlowX = mousePos.current.x + (centerX - mousePos.current.x) * 0.35;
        targetGlowY = mousePos.current.y + (centerY - mousePos.current.y) * 0.35;
      }

      if (reducedMotion) {
        // Immediate position without trailing physics when reduced motion is preferred
        dotPos.current = { ...mousePos.current };
        glowPos.current = { x: targetGlowX, y: targetGlowY };
      } else {
        // Core dot lerp factor ~0.3 (snappy 30ms response)
        dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.3;
        dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.3;

        // Outer glow lerp factor ~0.12 (soft 50-100ms floating trailing effect)
        glowPos.current.x += (targetGlowX - glowPos.current.x) * 0.12;
        glowPos.current.y += (targetGlowY - glowPos.current.y) * 0.12;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${glowPos.current.x}px, ${glowPos.current.y}px, 0) translate(-50%, -50%)`;
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
  }, [isVisible, hoverState]);

  // Don't render on mobile / touch devices
  if (isTouchDevice) return null;

  // Determine dynamic size & styling classes based on hoverState & mouseDown
  let glowClasses = 'w-10 h-10 border border-[#059669]/30 bg-[#059669]/10 shadow-[0_0_20px_rgba(5,150,105,0.25)]';
  let dotClasses = 'w-2.5 h-2.5 bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.6)]';
  let glowScale = 'scale-100';

  if (isMouseDown) {
    glowScale = 'scale-75 opacity-90';
  } else {
    switch (hoverState) {
      case 'button':
        glowClasses = 'w-14 h-14 border-2 border-[#F59E0B]/80 bg-gradient-to-r from-[#F59E0B]/20 to-[#059669]/15 shadow-[0_0_25px_rgba(245,158,11,0.45)]';
        dotClasses = 'w-3 h-3 bg-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.9)]';
        glowScale = 'scale-110';
        break;
      case 'card':
        glowClasses = 'w-12 h-12 border-2 border-[#059669]/60 bg-[#059669]/15 shadow-[0_0_22px_rgba(5,150,105,0.35)]';
        dotClasses = 'w-2.5 h-2.5 bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.8)]';
        glowScale = 'scale-105';
        break;
      case 'link':
        glowClasses = 'w-11 h-11 border border-[#059669]/50 bg-[#059669]/20 shadow-[0_0_18px_rgba(5,150,105,0.3)]';
        dotClasses = 'w-3 h-3 bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#F59E0B] shadow-[0_0_10px_rgba(5,150,105,0.6)]';
        glowScale = 'scale-110';
        break;
      case 'sakhi':
        glowClasses = 'w-16 h-16 border-2 border-[#F59E0B] bg-gradient-to-tr from-[#059669]/25 via-[#F59E0B]/25 to-[#0F172A]/20 shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-pulse-subtle';
        dotClasses = 'w-3.5 h-3.5 bg-gradient-to-r from-[#F59E0B] to-[#059669] ring-2 ring-white/80 shadow-[0_0_12px_rgba(245,158,11,1)]';
        glowScale = 'scale-125';
        break;
      default:
        break;
    }
  }

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Outer Floating Soft Glow Ring */}
      <div
        ref={glowRef}
        className={`absolute top-0 left-0 rounded-full backdrop-blur-[1px] transition-all duration-300 ease-out transform-gpu ${glowClasses} ${glowScale}`}
        style={{ willChange: 'transform' }}
      />

      {/* Main Core Gradient Dot */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 rounded-full transition-all duration-150 ease-out transform-gpu ${dotClasses}`}
        style={{ willChange: 'transform' }}
      />
    </div>
  );
};

