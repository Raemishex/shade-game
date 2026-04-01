"use client";

import { InputHTMLAttributes, ReactNode } from "react";

type InputVariant = "default" | "chat";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: InputVariant;
  icon?: ReactNode;
  suffix?: ReactNode;
  showCount?: boolean;
}

const variantStyles: Record<InputVariant, string> = {
  default:
    "bg-white/5 border border-white/10 focus:border-gold/50 rounded-xl px-4 py-3",
  chat:
    "bg-white/5 border border-white/10 focus:border-gold/50 rounded-full px-4 py-2",
};

export default function Input({
  label,
  error,
  variant = "default",
  icon,
  suffix,
  showCount = false,
  maxLength,
  value,
  className = "",
  ...props
}: InputProps) {
  const currentLength = typeof value === "string" ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-cream/70 text-sm mb-1.5 font-nunito">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40">
            {icon}
          </span>
        )}
        <input
          className={`
            w-full text-cream placeholder-cream/30 font-nunito
            outline-none transition-colors duration-200
            ${variantStyles[variant]}
            ${icon ? "pl-10" : ""}
            ${suffix ? "pr-10" : ""}
            ${error ? "border-red/50 focus:border-red" : ""}
            ${className}
          `}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40">
            {suffix}
          </span>
        )}
      </div>
      <div className="flex justify-between mt-1">
        {error && (
          <p className="text-red text-xs font-nunito">{error}</p>
        )}
        {showCount && maxLength && (
          <p
            className={`text-xs ml-auto font-nunito ${
              currentLength >= maxLength ? "text-red" : "text-cream/30"
            }`}
          >
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
