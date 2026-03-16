import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Typewriter({ text, delay = 0, speed = 80 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    setDisplayed('');
    setShowCursor(true);
    const startTimeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          // Hide cursor after a short pause
          setTimeout(() => setShowCursor(false), 1200);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(startTimeout);
  }, [text, delay, speed]);

  return (
    <>
      {displayed}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block ml-0.5"
          style={{ borderRight: '2px solid rgba(255,255,255,0.7)', height: '1em' }}
        >
          &nbsp;
        </motion.span>
      )}
    </>
  );
}

