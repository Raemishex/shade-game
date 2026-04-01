"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { FoxLogo } from "@/components/ui";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("auth.emailPasswordRequired"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
      <motion.div
        className="w-full max-w-sm"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Logo */}
        <motion.div className="flex flex-col items-center mb-10" variants={staggerItem}>
          <FoxLogo size={64} />
          <h1 className="text-2xl font-bold text-gold tracking-[4px] mt-3">SHADE</h1>
          <p className="text-cream/50 text-sm mt-1">{t("auth.login")}</p>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="bg-red/10 border border-red/20 rounded-xl px-4 py-3 mb-6 text-center"
            variants={fadeIn}
          >
            <p className="text-red text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form onSubmit={handleSubmit} variants={staggerItem}>
          <div className="space-y-4">
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
                placeholder={t("auth.passwordPlaceholder")}
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
                {t("auth.signingIn")}
              </span>
            ) : (
              t("auth.login")
            )}
          </motion.button>
        </motion.form>

        {/* Register link */}
        <motion.p className="text-center text-cream/50 text-sm mt-6" variants={staggerItem}>
          {t("auth.noAccount")}{" "}
          <Link href="/auth/register" className="text-gold hover:text-gold/80 transition-colors">
            {t("auth.register")}
          </Link>
        </motion.p>

        {/* Guest link */}
        <motion.p className="text-center text-cream/30 text-xs mt-3" variants={staggerItem}>
          <Link href="/home" className="hover:text-cream/50 transition-colors">
            {t("auth.continueAsGuest")}
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
