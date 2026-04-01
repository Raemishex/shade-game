"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Modal, Button } from "@/components/ui";
import { getGuestUser, updateGuestName } from "@/lib/guest";
import { useTranslation } from "@/hooks/useTranslation";

interface JoinGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGameModal({ isOpen, onClose }: JoinGameModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [cells, setCells] = useState<string[]>(["", "", "", "", "", ""]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Ad yüklə
  useEffect(() => {
    if (isOpen) {
      const guest = getGuestUser();
      if (guest.displayName && guest.displayName !== "Oyunçu") {
        setName(guest.displayName);
      }
      setCells(["", "", "", "", "", ""]);
      setError("");
      // İlk xanaya fokus
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const code = cells.join("");

  function handleCellChange(index: number, value: string) {
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!char) return;

    const newCells = [...cells];
    newCells[index] = char[0];
    setCells(newCells);
    setError("");

    // Növbəti xanaya keç
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newCells = [...cells];
      if (cells[index]) {
        newCells[index] = "";
        setCells(newCells);
      } else if (index > 0) {
        newCells[index - 1] = "";
        setCells(newCells);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "Enter" && code.length === 6) {
      handleJoin();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  // Clipboard paste dəstəyi
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    if (pasted.length === 0) return;

    const newCells = [...cells];
    for (let i = 0; i < 6; i++) {
      newCells[i] = pasted[i] || "";
    }
    setCells(newCells);
    setError("");

    // Son dolu xanaya fokus
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  }

  const handleJoin = useCallback(async () => {
    if (code.length !== 6) {
      setError(t("join.codeLength"));
      return;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError(t("join.nameMinError"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const guest = updateGuestName(trimmedName);

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
        onClose();
        router.push(`/lobby/${code}`);
      } else {
        setError(data.error || t("join.joinFailed"));
      }
    } catch {
      setError(t("join.serverError"));
    } finally {
      setLoading(false);
    }
  }, [code, name, onClose, router]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("join.title")}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t("join.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleJoin}
            disabled={code.length !== 6 || name.trim().length < 2}
            loading={loading}
          >
            {t("join.join")}
          </Button>
        </>
      }
    >
      {/* Ad input */}
      <div className="mb-4">
        <label className="block text-cream/70 text-sm mb-1.5 font-nunito">{t("join.nameLabel")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder={t("join.namePlaceholder")}
          maxLength={20}
          className="w-full bg-white/5 border border-white/10 focus:border-gold/50 rounded-xl px-4 py-2.5 text-cream placeholder-cream/30 font-nunito outline-none transition-colors"
        />
      </div>

      {/* 6-cell code input */}
      <label className="block text-cream/70 text-sm mb-1.5 font-nunito">{t("join.roomCode")}</label>
      <div className="flex gap-2 justify-center mb-2" onPaste={handlePaste}>
        {cells.map((cell, i) => (
          <motion.input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="text"
            maxLength={1}
            value={cell}
            onChange={(e) => handleCellChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`
              w-11 h-13 text-center text-xl font-bold font-nunito uppercase
              bg-white/5 border rounded-lg outline-none transition-all
              ${cell ? "border-gold/50 text-gold" : "border-white/10 text-cream"}
              focus:border-gold focus:bg-gold/5
            `}
            whileFocus={{ scale: 1.05 }}
          />
        ))}
      </div>

      <p className="text-cream/50 text-xs text-center mb-1 font-nunito">
        {t("join.pasteHint")}
      </p>

      {error && (
        <motion.p
          className="text-red text-xs text-center mt-2 font-nunito"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </Modal>
  );
}
