"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FoxLogo } from "@/components/ui";
import { getGuestUser } from "@/lib/guest";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName || !email || !password || !confirmPassword) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordMinLength"));
      return;
    }

    setLoading(true);

    try {
      const guest = getGuestUser();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          password,
          guestUserId: guest?.userId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("auth.errorOccurred"));
        setLoading(false);
        return;
      }

      router.push("/home");
    } catch {
      setError(t("auth.connectionError"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <FoxLogo size={64} />
          <h1 className="text-2xl font-bold text-gold tracking-[4px] mt-3">SHADE</h1>
          <p className="text-cream/50 text-sm mt-1">{t("auth.createAccount")}</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 mb-6 text-center"
          >
            <p className="text-red text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-cream/60 text-xs mb-1.5 ml-1">{t("auth.name")}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("auth.namePlaceholder")}
                maxLength={30}
                className="w-full bg-cream/[0.04] border border-gold/20 rounded-xl px-4 py-3 text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/50 transition-colors font-nunito"
              />
            </div>

            <div>
              <label className="block text-cream/60 text-xs mb-1.5 ml-1">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="w-full bg-cream/[0.04] border border-gold/20 rounded-xl px-4 py-3 text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/50 transition-colors font-nunito"
              />
            </div>

            <div>
              <label className="block text-cream/60 text-xs mb-1.5 ml-1">{t("auth.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordMin6")}
                className="w-full bg-cream/[0.04] border border-gold/20 rounded-xl px-4 py-3 text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/50 transition-colors font-nunito"
              />
            </div>

            <div>
              <label className="block text-cream/60 text-xs mb-1.5 ml-1">{t("auth.confirmPassword")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                className="w-full bg-cream/[0.04] border border-gold/20 rounded-xl px-4 py-3 text-cream placeholder:text-cream/20 focus:outline-none focus:border-gold/50 transition-colors font-nunito"
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gold text-dark font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("auth.registering")}
              </span>
            ) : (
              t("auth.register")
            )}
          </motion.button>
        </form>

        {/* Login link */}
        <p className="text-center text-cream/50 text-sm mt-6">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link href="/auth/login" className="text-gold hover:text-gold/80 transition-colors">
            {t("auth.login")}
          </Link>
        </p>

        {/* Guest link */}
        <p className="text-center text-cream/30 text-xs mt-3">
          <Link href="/home" className="hover:text-cream/50 transition-colors">
            {t("auth.continueAsGuest")}
          </Link>
        </p>
      </div>
    </div>
  );
}
