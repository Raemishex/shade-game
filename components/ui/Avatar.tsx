"use client";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  name: string;
  color?: string;
  size?: AvatarSize;
  online?: boolean;
  isHost?: boolean;
  className?: string;
}

const sizeStyles: Record<AvatarSize, { container: string; text: string; indicator: string }> = {
  sm: { container: "w-6 h-6", text: "text-[10px]", indicator: "w-2 h-2 -bottom-0.5 -right-0.5" },
  md: { container: "w-9 h-9", text: "text-xs", indicator: "w-2.5 h-2.5 -bottom-0.5 -right-0.5" },
  lg: { container: "w-14 h-14", text: "text-lg", indicator: "w-3 h-3 bottom-0 right-0" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Avatar({
  name,
  color = "#C8A44E",
  size = "md",
  online,
  isHost = false,
  className = "",
}: AvatarProps) {
  const styles = sizeStyles[size];

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          ${styles.container} rounded-full flex items-center justify-center
          font-nunito font-bold select-none
        `}
        style={{ backgroundColor: color + "33", color }}
      >
        <span className={styles.text}>{getInitials(name)}</span>
      </div>

      {/* Online indicator */}
      {online !== undefined && (
        <span
          className={`
            absolute ${styles.indicator} rounded-full border-2 border-dark
            ${online ? "bg-green" : "bg-cream/30"}
          `}
        />
      )}

      {/* Host crown */}
      {isHost && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-gold text-[10px]">
          👑
        </span>
      )}
    </div>
  );
}
