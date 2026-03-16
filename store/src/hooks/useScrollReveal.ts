import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook that detects when an element enters the viewport.
 * Returns a ref to attach and a boolean indicating if revealed.
 */
export function useScrollReveal(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isRevealed) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px',
        ...options,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isRevealed, options]);

  return { ref, isRevealed };
}
