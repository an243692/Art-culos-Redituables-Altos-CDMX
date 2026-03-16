'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** 'fadeUp' | 'fadeIn' | 'scaleUp' | 'slideRight' */
  variant?: 'fadeUp' | 'fadeIn' | 'scaleUp' | 'slideRight';
  /** Duration in seconds */
  duration?: number;
  style?: React.CSSProperties;
}

const variants = {
  fadeUp: {
    hidden: { opacity: 0, transform: 'translateY(28px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scaleUp: {
    hidden: { opacity: 0, transform: 'scale(0.85)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  slideRight: {
    hidden: { opacity: 0, transform: 'translateX(-30px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'fadeUp',
  duration = 0.55,
  style = {},
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const v = variants[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(isRevealed ? v.visible : v.hidden),
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
