"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type CardVariant = "default" | "glow" | "selected";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white/5 border border-white/10",
  glow: "bg-white/5 border border-gold/30 shadow-[0_0_20px_rgba(200,164,78,0.15)]",
  selected: "bg-white/5 border-2 border-green",
};

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export default function Card({
  variant = "default",
  padding = "md",
  children,
  className = "",
  onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      className={`
        rounded-xl backdrop-blur-sm
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
