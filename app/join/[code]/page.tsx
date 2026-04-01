"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import FoxLogo from "@/components/ui/FoxLogo";
import { Button } from "@/components/ui";
import { getGuestUser, updateGuestName } from "@/lib/guest";

export default function JoinByLinkPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params.code as string)?.toUpperCase();

  const [status, setStatus] = useState<"name" | "joining" | "error">("name");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const guest = getGuestUser();
    if (guest.displayName && guest.displayName !== "Oyunçu") {
      setName(guest.displayName);
    }
  }, []);

  async function handleJoin() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Ad minimum 2 simvol olmalıdır");
      return;
    }

    setStatus("joining");
    setError("");

    try {
      const guest = updateGuestName(trimmed);

      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: guest.userId,
          displayName: guest.displayName,
          avatarColor: guest.avatarColor,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/lobby/${code}`);
      } else {
        setError(data.error || "Qoşulma uğursuz oldu");
        setStatus("error");
      }
    } catch {
      setError("Serverlə əlaqə qurula bilmədi");
      setStatus("error");
    }
  }

  // Joining animation
  if (status === "joining") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <FoxLogo size={80} className="mb-6" />
        <motion.div
          className="flex gap-1.5 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-cream/60 text-lg font-nunito">Otağa qoşulursunuz</span>
          <motion.span
            className="text-gold text-lg"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.div>
        <p className="text-gold/60 text-sm font-nunito tracking-wider">{code}</p>
        <div className="w-48 h-1 bg-cream/10 rounded-full overflow-hidden mt-4">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-dark px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <FoxLogo size={64} className="mb-4" />

      <h1 className="text-xl font-bold text-cream mb-1 font-nunito">Oyuna qoşul</h1>
      <p className="text-gold/60 text-sm font-nunito tracking-wider mb-6">
        Otaq: {code}
      </p>

      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-cream/70 text-sm mb-1.5 font-nunito">Sənin adın</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Adını yaz..."
            maxLength={20}
            autoFocus
            className="w-full bg-white/5 border border-white/10 focus:border-gold/50 rounded-xl px-4 py-3 text-cream placeholder-cream/30 font-nunito outline-none transition-colors"
          />
        </div>

        {error && (
          <motion.p
            className="text-red text-sm text-center font-nunito"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleJoin}
          disabled={name.trim().length < 2}
        >
          Qoşul
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => router.push("/home")}
        >
          Ana ekrana qayıt
        </Button>
      </div>
    </motion.div>
  );
}
