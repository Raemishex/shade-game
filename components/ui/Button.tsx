"use client";

import { motion, HTMLMotionProps, AnimatePresence } from "framer-motion";
import { ReactNode, useCallback, useState, useRef } from "react";
import SoundManager from "@/lib/sounds";

type ButtonVariant = "primary" | "secondary" | "gold" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-green border border-green/60 hover:bg-green/90",
  secondary: "bg-blue border border-blue/60 hover:bg-blue/90",
  gold: "bg-gold/[0.08] border border-gold/20 text-gold hover:bg-gold/10",
  ghost: "bg-transparent text-cream border border-cream/10 hover:bg-cream/10",
  danger: "bg-red text-white hover:bg-red/90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg md:px-5 md:py-2.5 md:text-base",
  md: "px-6 py-3 text-base rounded-xl md:px-8 md:py-3.5 md:text-lg",
  lg: "px-8 py-4 text-lg rounded-xl md:px-10 md:py-5 md:text-xl",
};

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let rippleId = 0;

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    try { SoundManager.getInstance().playSfx("button_click"); } catch {}

    // Ripple effekti
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple: Ripple = {
        id: ++rippleId,
        x: e.clientX - rect.left - size / 2,
        y: e.clientY - rect.top - size / 2,
        size,
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.(e);
  }, [onClick, disabled, loading]);

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleClick}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        font-nunito font-medium inline-flex items-center justify-center gap-2
        transition-colors duration-200 relative overflow-hidden
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 2.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
