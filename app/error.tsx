"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[RootError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-[48px] mb-3">🦊</p>
        <h1 className="text-cream text-[20px] font-semibold font-nunito mb-2">
          Bir şeylər səhv getdi
        </h1>
        <p className="text-cream/50 text-[13px] font-nunito mb-6">
          Xahiş edirik yenidən cəhd edin.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-gold text-dark text-[14px] font-medium font-nunito hover:bg-gold/90 transition-colors"
        >
          Yenidən cəhd et
        </button>
      </div>
    </div>
  );
}
