import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number; // duration in ms
  formatter?: (val: number) => string;
  className?: string;
}

export function CountUp({ value, duration = 500, formatter, className }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;
    const endValue = value;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad/cubic for smooth transition
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(startValue + easeProgress * (endValue - startValue));
      
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const displayValue = formatter ? formatter(count) : count.toFixed(0);

  return <span className={className}>{displayValue}</span>;
}
