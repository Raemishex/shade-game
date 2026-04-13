"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getGuestUser, updateGuestName } from "@/lib/guest";
import { generateRoomCode } from "@/lib/generateCode";
import { Button, Input } from "@/components/ui";
import FoxLogo from "@/components/ui/FoxLogo";
import { useTranslation } from "@/hooks/useTranslation";

export default function CreateLobbyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"name" | "creating">("name");
  // Qonaq istifadəçi əvvəldən ad daxil edibsə, avtomatik skip et
  const [autoStarting, setAutoStarting] = useState(false);

  useEffect(() => {
    const guest = getGuestUser();
    if (guest.displayName && guest.displayName !== "Oyunçu") {
      setName(guest.displayName);
      // Əgər qonaq artıq ad daxil edibsə, avtomatik otaq yarat
      // İlk dəfə gələnlər üçün "Oyunçu_XXXX" formatında ad olacaq
    }

    // Əgər qonaq ad daxil etməyibsə belə, avtomatik yaradılmış adla davam et
    // Beləliklə, qonaqlar heç bir addım olmadan oyuna daxil ola bilərlər
    if (guest.displayName && guest.displayName.length >= 2) {
      setAutoStarting(true);
    }
  }, []);

  // Avtomatik start: əgər qonağın artıq adı varsa, birbaşa otaq yarat
  useEffect(() => {
    if (autoStarting && name.length >= 2) {
      handleCreate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStarting, name]);

  async function handleCreate(isAutoStart = false) {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      if (!isAutoStart) {
        setError(t("lobbyCreate.nameMinError"));
      }
      setAutoStarting(false);
      return;
    }
    if (trimmed.length > 20) {
      if (!isAutoStart) {
        setError(t("lobbyCreate.nameMaxError"));
      }
      setAutoStarting(false);
      return;
    }

    setStep("creating");
    setLoading(true);
    setError("");

    try {
      const guest = updateGuestName(trimmed);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: guest.userId,
          displayName: guest.displayName,
          avatarColor: guest.avatarColor,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();

      if (data.success) {
        router.push(`/lobby/${data.room.code}`);
      } else if (data.dbError) {
        // MongoDB yoxdur — lokal kod ilə Socket.io lobbiyə keç
        const localCode = generateRoomCode();
        router.push(`/lobby/${localCode}`);
      } else {
        setError(data.error || t("lobbyCreate.createFailed"));
        setStep("name");
        setLoading(false);
        setAutoStarting(false);
      }
    } catch {
      // Server/timeout xətası — lokal kod ilə davam et
      const guest = getGuestUser();
      updateGuestName(trimmed);
      const localCode = generateRoomCode();
      void guest;
      router.push(`/lobby/${localCode}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCreate();
  }

  if (step === "creating" || autoStarting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark px-6">
        <FoxLogo size={80} className="mb-6" />
        <motion.div
          className="flex gap-1.5 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-cream/60 text-lg font-nunito">{t("lobbyCreate.creating")}</span>
          <motion.span
            className="text-gold text-lg"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            ...
          </motion.span>
        </motion.div>
        <div className="w-48 h-1 bg-cream/10 rounded-full overflow-hidden">
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
      <FoxLogo size={64} className="mb-6" />

      <h1 className="text-xl font-bold text-cream mb-1 font-nunito">{t("lobbyCreate.title")}</h1>
      <p className="text-cream/50 text-sm mb-8 font-nunito">{t("lobbyCreate.subtitle")}</p>

      <div className="w-full max-w-sm space-y-4">
        <Input
          label={t("lobbyCreate.nameLabel")}
          placeholder={t("lobbyCreate.namePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          error={error}
          maxLength={20}
          showCount
          autoFocus
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onClick={() => handleCreate()}
          disabled={name.trim().length < 2}
        >
          {t("lobbyCreate.create")}
        </Button>

        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => router.push("/home")}
        >
          {t("lobbyCreate.goBack")}
        </Button>
      </div>
    </motion.div>
  );
}
