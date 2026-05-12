import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CountUpProps {
  value: number;
  duration?: number; // seconds
  className?: string;
}

/**
 * Animates a number from its previous value to `value` over `duration` seconds.
 * Uses requestAnimationFrame; respects prefers-reduced-motion.
 */
export const CountUp = ({ value, duration = 0.6, className }: CountUpProps) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = display;
    fromRef.current = from;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (value - from) * eased);
      setDisplay(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <motion.span className={className}>{display}</motion.span>;
};
