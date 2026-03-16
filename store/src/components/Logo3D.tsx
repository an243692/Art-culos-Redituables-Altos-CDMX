import React, { useRef, useEffect }  from 'react';
import { motion } from 'framer-motion';
import { cldOpt } from '@/lib/utils';

export function Logo3D({ logoUrl }: { logoUrl: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // ── Mouse/Touch: track relative to logo center for precise control ──
    const onMove = (e: MouseEvent | TouchEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let cx: number, cy: number;
      if ('touches' in e) {
        cx = e.touches[0].clientX;
        cy = e.touches[0].clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }

      // Normaliza -1 a 1 relativo al centro del logo
      const nx = Math.max(-1, Math.min(1, (cx - centerX) / 120));
      const ny = Math.max(-1, Math.min(1, (cy - centerY) / 120));

      // Rotación amplia para efecto dramático ±35°
      targetRot.current = { x: -ny * 35, y: nx * 35 };
    };

    const onLeave = () => {
      if (!isDragging.current) {
        targetRot.current = { x: 0, y: 0 };
      }
    };

    // ── Drag support: direct rotation tracking ──
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        // Directly add rotation for drag feel
        targetRot.current = {
          x: Math.max(-45, Math.min(45, targetRot.current.x - dy * 0.8)),
          y: Math.max(-45, Math.min(45, targetRot.current.y + dx * 0.8)),
        };
      } else {
        onMove(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      el.releasePointerCapture(e.pointerId);
      el.style.cursor = 'grab';
      // Spring back slowly
      targetRot.current = { x: 0, y: 0 };
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('touchmove', onMove, { passive: true });

    // Smooth lerp animation loop
    const loop = () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const speed = isDragging.current ? 0.18 : 0.06;
      currentRot.current.x = lerp(currentRot.current.x, targetRot.current.x, speed);
      currentRot.current.y = lerp(currentRot.current.y, targetRot.current.y, speed);

      if (imgRef.current) {
        imgRef.current.style.transform =
          `rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg) translateZ(12px)`;

        // Dynamic shine position tracks rotation
        const hx = 50 - currentRot.current.y * 1.2;
        const hy = 50 - currentRot.current.x * 1.2;
        const shine = imgRef.current.querySelector<HTMLDivElement>('.logo-shine');
        if (shine) {
          shine.style.background =
            `radial-gradient(circle at ${hx}% ${hy}%, rgba(255,255,255,0.28) 0%, transparent 60%)`;
        }

        // Dynamic shadow based on rotation
        const shadowX = -currentRot.current.y * 0.5;
        const shadowY = currentRot.current.x * 0.5 + 15;
        imgRef.current.style.boxShadow =
          `${shadowX}px ${shadowY}px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('touchmove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="mb-4 select-none touch-none relative"
      style={{ perspective: '800px', perspectiveOrigin: '50% 50%', cursor: 'grab' }}
    >
      {/* White gleam glow behind logo */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      {/* Flotación */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center"
      >
        {/* Contenedor 3D — 100px (más pequeño) */}
        <div
          ref={imgRef}
          style={{
            width: 100, height: 100,
            borderRadius: 22,
            position: 'relative',
            transformStyle: 'preserve-3d',
            boxShadow: '0 15px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cldOpt(logoUrl, 200) || '/logo.jpg'}
            alt="Artículos Redituables"
            draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              borderRadius: 22,
              display: 'block',
              pointerEvents: 'none',
            }}
          />

          {/* Dynamic shine layer */}
          <div
            className="logo-shine"
            style={{
              position: 'absolute', inset: 0,
              borderRadius: 22,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.22) 0%, transparent 60%)',
              transition: 'background 0.03s linear',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Border highlight */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 22,
            border: '1px solid rgba(255,255,255,0.15)',
            pointerEvents: 'none',
          }} />

          {/* Bottom edge reflection */}
          <div style={{
            position: 'absolute', bottom: -2, left: 6, right: 6, height: 14,
            borderRadius: '0 0 16px 16px',
            background: 'rgba(255,255,255,0.04)',
            filter: 'blur(6px)',
            transform: 'translateZ(-8px) rotateX(8deg)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Shadow below that scales with float */}
        <motion.div
          animate={{ scaleX: [1, 0.7, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="rounded-full blur-lg mt-3"
          style={{ width: 70, height: 10, background: 'rgba(255,255,255,0.06)' }}
        />
      </motion.div>
    </motion.div>
  );
}

