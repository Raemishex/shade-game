"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedMap = {
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
  full: "rounded-full",
};

export default function Skeleton({
  className = "",
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-cream/[0.04] via-cream/[0.08] from-cream/[0.04] bg-[length:200%_100%] ${roundedMap[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

// ---------- Leaderboard Skeleton ----------
export function LeaderboardSkeleton() {
  return (
    <div className="px-6 space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3 py-3 border-b border-cream/[0.03]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
        >
          <Skeleton className="w-7 h-7" rounded="full" />
          <Skeleton className="w-9 h-9" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-16" />
          </div>
          <Skeleton className="h-5 w-10" rounded="md" />
          <Skeleton className="h-4 w-12" />
        </motion.div>
      ))}
    </div>
  );
}

// ---------- History Skeleton ----------
export function HistorySkeleton() {
  return (
    <div className="px-6 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-xl bg-cream/[0.02] border border-cream/[0.05] p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10" rounded="lg" />
            <div className="flex-1 space-y-1.5">
              <div className="flex gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-2.5 w-14" rounded="md" />
                <Skeleton className="h-2.5 w-10" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
            <Skeleton className="h-2.5 w-10" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ---------- Profile Skeleton ----------
export function ProfileSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="pt-6 pb-4 px-6 text-center border-b border-gold/[0.06]">
        <Skeleton className="w-[76px] h-[76px] mx-auto mb-3" rounded="full" />
        <Skeleton className="h-5 w-32 mx-auto mb-1.5" />
        <Skeleton className="h-3 w-20 mx-auto" />
      </div>
      <div className="px-6 pt-3">
        {/* Stats */}
        <div className="flex gap-2 mb-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 py-2.5 px-1.5 rounded-[10px] bg-gold/[0.04] border border-gold/[0.08] text-center">
              <Skeleton className="h-5 w-8 mx-auto mb-1" />
              <Skeleton className="h-2 w-10 mx-auto" />
            </div>
          ))}
        </div>
        {/* Win rate */}
        <div className="p-3 rounded-[10px] bg-cream/[0.02] border border-cream/[0.04] mb-3.5">
          <div className="flex justify-between mb-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-2.5 w-12" />
          </div>
        </div>
        {/* Badges */}
        <Skeleton className="h-2.5 w-20 mb-2.5" />
        <div className="flex gap-2.5 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[54px] text-center">
              <Skeleton className="w-11 h-11 mx-auto mb-1" rounded="lg" />
              <Skeleton className="h-2 w-10 mx-auto" />
            </div>
          ))}
        </div>
        {/* Settings */}
        <Skeleton className="h-2.5 w-16 mb-2.5" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-cream/[0.03]">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-8 h-8" rounded="lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
            <Skeleton className="w-9 h-5" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}
