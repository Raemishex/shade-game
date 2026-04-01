import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-[64px] font-bold text-gold/30 font-nunito mb-2">404</p>
        <h1 className="text-cream text-[20px] font-semibold font-nunito mb-2">
          Səhifə tapılmadı
        </h1>
        <p className="text-cream/50 text-[13px] font-nunito mb-6">
          Axtardığınız səhifə mövcud deyil və silinib.
        </p>
        <Link
          href="/home"
          className="inline-block px-6 py-3 rounded-xl bg-gold text-dark text-[14px] font-medium font-nunito hover:bg-gold/90 transition-colors"
        >
          Ana səhifə
        </Link>
      </div>
    </div>
  );
}
