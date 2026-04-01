"use client";

import { motion } from "framer-motion";
import { getBadgeById, type BadgeDefinition } from "@/lib/badges";

interface BadgeCardProps {
  badgeId: string;
  unlocked: boolean;
  unlockedAt?: string | null; // ISO date
  size?: "sm" | "md" | "lg";
}

// Badge SVG icon renderer
function BadgeIconSVG({ icon, color, size }: { icon: string; color: string; size: number }) {
  switch (icon) {
    case "star":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M10 3L12 8H17L13 11L14.5 16L10 13L5.5 16L7 11L3 8H8Z" fill={color} />
        </svg>
      );
    case "check":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M7 10l2 2 4-4" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "flame":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M10 2C8 5 5 7 5 11c0 2.8 2.2 5 5 5s5-2.2 5-5c0-4-3-6-5-9z" fill={color} opacity="0.85" />
        </svg>
      );
    case "eye":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M10 5C5 5 2 10 2 10s3 5 8 5 8-5 8-5-3-5-8-5z" fill="none" stroke={color} strokeWidth="1.2" />
          <circle cx="10" cy="10" r="2.5" fill={color} />
        </svg>
      );
    case "lightning":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M11 2L5 11h5l-1 7 6-9h-5l1-7z" fill={color} />
        </svg>
      );
    case "trophy":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M6 4h8v6c0 2.2-1.8 4-4 4s-4-1.8-4-4V4z" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M8 16h4M10 14v2" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    case "people":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="7" cy="7" r="3" fill="none" stroke={color} strokeWidth="1.2" />
          <circle cx="13" cy="7" r="3" fill="none" stroke={color} strokeWidth="1.2" />
          <path d="M1 17c0-3 2.7-5 6-5M13 12c3.3 0 6 2 6 5" fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
      );
    case "moon":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M13 3a7 7 0 100 14 5 5 0 010-14z" fill={color} opacity="0.85" />
        </svg>
      );
    case "crown":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M3 14L5 7l4 3 1-6 1 6 4-3 2 7H3z" fill={color} />
        </svg>
      );
    case "shield":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <path d="M10 2L4 5v5c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V5L10 2z" fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="7" fill={color} opacity="0.5" />
        </svg>
      );
  }
}

// Lock icon
function LockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <rect x="5" y="9" width="10" height="8" rx="1.5" fill="none" stroke="#555" strokeWidth="1" />
      <path d="M7 9V7a3 3 0 016 0v2" fill="none" stroke="#555" strokeWidth="1" />
    </svg>
  );
}

const sizeConfig = {
  sm: { card: "w-[54px]", icon: "w-10 h-10", iconSize: 18, text: "text-[8px]", desc: false },
  md: { card: "w-[80px]", icon: "w-14 h-14", iconSize: 24, text: "text-[10px]", desc: true },
  lg: { card: "w-full", icon: "w-16 h-16", iconSize: 28, text: "text-[12px]", desc: true },
};

export default function BadgeCard({ badgeId, unlocked, unlockedAt, size = "md" }: BadgeCardProps) {
  const badge: BadgeDefinition | undefined = getBadgeById(badgeId);
  if (!badge) return null;

  const cfg = sizeConfig[size];
  const isLarge = size === "lg";

  return (
    <motion.div
      className={`${cfg.card} ${isLarge ? "flex items-center gap-3 p-3 rounded-xl" : "text-center flex-shrink-0"} ${
        !unlocked ? "opacity-30" : ""
      }`}
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Icon */}
      <div
        className={`${cfg.icon} rounded-xl flex items-center justify-center ${isLarge ? "flex-shrink-0" : "mx-auto mb-1"}`}
        style={{
          background: unlocked ? `${badge.color}15` : "rgba(255,255,255,0.03)",
          border: unlocked ? `0.5px solid ${badge.color}33` : "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        {unlocked ? (
          <BadgeIconSVG icon={badge.icon} color={badge.color} size={cfg.iconSize} />
        ) : (
          <LockIcon size={cfg.iconSize} />
        )}
      </div>

      {/* Text */}
      {isLarge ? (
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-cream font-medium truncate">
            {unlocked ? badge.nameAz : "???"}
          </div>
          <div className="text-[10px] text-cream/40 mt-0.5">
            {badge.description}
          </div>
          {unlocked && unlockedAt && (
            <div className="text-[9px] text-gold/50 mt-1">
              {new Date(unlockedAt).toLocaleDateString("az-AZ")}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={`${cfg.text} text-cream/40 leading-tight`}>
            {unlocked ? badge.nameAz : "???"}
          </div>
          {cfg.desc && unlocked && (
            <div className="text-[8px] text-cream/20 mt-0.5 leading-tight">
              {badge.description}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
