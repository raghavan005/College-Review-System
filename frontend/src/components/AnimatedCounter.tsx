import { useEffect, useMemo, useState } from 'react';

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export const AnimatedCounter = ({
  value,
  durationMs = 900,
  decimals = 0,
}: {
  value: number;
  durationMs?: number;
  decimals?: number;
}) => {
  const [display, setDisplay] = useState(0);

  const target = useMemo(() => (Number.isFinite(value) ? value : 0), [value]);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = display;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
};

