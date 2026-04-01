"use client";

import { useEffect } from "react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SettingsError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-[48px] mb-3">⚙️</p>
        <h1 className="text-cream text-[20px] font-semibold font-nunito mb-2">
          Ayarlar yüklənmədi
        </h1>
        <p className="text-cream/50 text-[13px] font-nunito mb-6">
          Ayarlar səhifəsi yüklənərkən xəta baş verdi.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-gold text-dark text-[14px] font-medium font-nunito hover:bg-gold/90 transition-colors"
          >
            Yenidən cəhd et
          </button>
          <a
            href="/home"
            className="px-6 py-3 rounded-xl border border-cream/10 text-cream/60 text-[14px] font-medium font-nunito hover:text-cream transition-colors"
          >
            Ana səhifə
          </a>
        </div>
      </div>
    </div>
  );
}
