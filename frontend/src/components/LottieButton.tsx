import { useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import lottie from 'lottie-web';
import animationData from '../lottie/loading/animations/12345.json';
import { cn } from '../lib/utils';

interface LottieButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'outline';
  fullWidth?: boolean;
}

/** Small inline lottie container that mounts/destroys the animation via lottie-web */
function LottieIcon() {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    return () => anim.destroy();
  }, []);

  return (
    <span
      ref={containerRef}
      className="block shrink-0"
      style={{ width: 28, height: 28, overflow: 'hidden' }}
    />
  );
}

export function LottieButton({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  variant = 'primary',
  fullWidth = false,
  ...props
}: LottieButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 rounded-xl h-10 px-5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20',
    outline: 'border border-border bg-transparent text-foreground hover:bg-muted',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(base, variants[variant], fullWidth && 'w-full', className)}
    >
      {loading ? (
        <>
          <LottieIcon />
          <span>{loadingText ?? 'Loading...'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
