"use client";

type BadgeVariant = "host" | "ready" | "waiting" | "imposter" | "citizen";

interface BadgeProps {
  variant?: BadgeVariant;
  text: string;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  host: "bg-gold/20 text-gold border-gold/30",
  ready: "bg-green/20 text-green border-green/30",
  waiting: "bg-cream/10 text-cream/50 border-cream/20",
  imposter: "bg-red/20 text-red border-red/30",
  citizen: "bg-green/20 text-green border-green/30",
};

export default function Badge({
  variant = "waiting",
  text,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
        border font-nunito
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {text}
    </span>
  );
}
