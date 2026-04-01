import type { Variants, Transition } from "framer-motion";

// =============================================
// SƏHIFƏ KEÇİDLƏRİ
// =============================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.3 } },
};

export const slideFromRight: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.3 } },
};

export const slideFromLeft: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: 60, transition: { duration: 0.3 } },
};

// =============================================
// STAGGER (children)
// =============================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// Kart siyahısı üçün daha sürətli stagger
export const cardStaggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const cardStaggerItem: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// =============================================
// DÜYMƏ ANİMASİYALARI
// =============================================

export const buttonPress = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02 },
  transition: { type: "spring", stiffness: 400, damping: 17 } as Transition,
};

export const buttonRipple: Variants = {
  initial: { scale: 0, opacity: 0.4 },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// =============================================
// KART ANİMASİYALARI
// =============================================

export const cardFlip: Variants = {
  front: { rotateY: 0, transition: { duration: 0.6, ease: "easeInOut" } },
  back: { rotateY: 180, transition: { duration: 0.6, ease: "easeInOut" } },
};

export const cardGlowPulse: Variants = {
  idle: {
    boxShadow: "0 0 0px rgba(200,164,78,0)",
  },
  selected: {
    boxShadow: [
      "0 0 8px rgba(200,164,78,0.2)",
      "0 0 20px rgba(200,164,78,0.4)",
      "0 0 8px rgba(200,164,78,0.2)",
    ],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

// =============================================
// SİYAHI ANİMASİYALARI (AnimatePresence)
// =============================================

// Oyunçu əlavə olunanda
export const listItemEnter: Variants = {
  initial: { opacity: 0, x: -40, height: 0 },
  animate: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 40,
    height: 0,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

// İpucu gəldikdə
export const clueEnter: Variants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// =============================================
// TOAST ANİMASİYALARI
// =============================================

export const toastSlide: Variants = {
  initial: { opacity: 0, y: -40, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// =============================================
// LOADİNG ANİMASİYALARI
// =============================================

// Skeleton shimmer
export const skeletonShimmer: Variants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// 3 nöqtə bounce (typing indicator)
export const typingDot: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Dairəvi spinner
export const spinner: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" },
  },
};

// =============================================
// PULSE / FLOAT
// =============================================

export const pulse: Variants = {
  normal: { scale: 1 },
  warning: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.5, repeat: Infinity },
  },
};

export const float: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// =============================================
// NƏTİCƏ ANİMASİYALARI
// =============================================

// Konfetti parça
export const confettiBurst: Variants = {
  initial: { scale: 0, opacity: 1 },
  animate: {
    scale: [0, 1.5],
    opacity: [1, 0],
    transition: { duration: 1, ease: "easeOut" },
  },
};

// Konfetti parçası (yuxarıdan düşür)
export const confettiPiece = (index: number): Variants => ({
  initial: {
    y: -20,
    x: Math.random() * 300 - 150,
    rotate: 0,
    opacity: 1,
  },
  animate: {
    y: [-(Math.random() * 100), (typeof window !== "undefined" ? window.innerHeight : 800)],
    x: Math.random() * 300 - 150,
    rotate: Math.random() * 720 - 360,
    opacity: [1, 1, 0],
    transition: {
      duration: 2 + Math.random() * 1.5,
      delay: index * 0.04,
      ease: "easeIn",
    },
  },
});

// Avatar reveal
export const avatarReveal: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.1, 1],
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 12,
    },
  },
};

// XP counter (rəqəm artma animasiyası üçün parametrlər)
export const xpCounterTransition: Transition = {
  duration: 1.2,
  ease: "easeOut",
};
