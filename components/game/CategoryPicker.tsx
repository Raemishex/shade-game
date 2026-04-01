"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import CustomWordModal from "./CustomWordModal";

interface CategoryData {
  id: string;
  nameAz: string;
  nameEn: string;
  icon: string;
  wordCount: number;
}

interface CategoryPickerProps {
  selected: string;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

export default function CategoryPicker({
  selected,
  onSelect,
  onClose,
}: CategoryPickerProps) {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customWordModal, setCustomWordModal] = useState<{ open: boolean; catId: string; catName: string }>({
    open: false,
    catId: "",
    catName: "",
  });
  // Çox seçim: vergüllə ayrılmış string → array
  const [current, setCurrent] = useState<string[]>(
    selected ? selected.split(",").filter(Boolean) : []
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCategories(data.categories);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = useCallback((catId: string) => {
    setCurrent((prev) => {
      if (prev.includes(catId)) {
        // Ən azı 1 kateqoriya seçili olmalıdır
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setCurrent(categories.map((c) => c.id));
  }, [categories]);

  const handleConfirm = useCallback(() => {
    onSelect(current.join(","));
    onClose();
  }, [current, onSelect, onClose]);

  const totalWords = categories
    .filter((c) => current.includes(c.id))
    .reduce((sum, c) => sum + c.wordCount, 0);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md max-h-[85vh] bg-[#141210] border border-gold/10 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gold/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-medium text-cream font-nunito">
              Kateqoriya seç
            </h2>
            <p className="text-[10px] text-cream/50 font-nunito">
              {current.length} seçildi · {totalWords} söz
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-[11px] text-gold/70 hover:text-gold font-nunito transition-colors"
            >
              Hamısı
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center"
            >
              <svg width="12" height="12" viewBox="0 0 20 20">
                <path d="M5 5l10 10M15 5L5 15" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <span className="text-cream/50 text-sm font-nunito">Yüklənir...</span>
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {categories.map((cat, i) => {
                const isSelected = current.includes(cat.id);

                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all text-center ${
                      isSelected
                        ? "border-gold/40 bg-gold/[0.08]"
                        : "border-white/[0.04] bg-white/[0.02] hover:border-gold/15 hover:bg-gold/[0.03]"
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={
                      isSelected
                        ? { boxShadow: "0 0 16px rgba(200,164,78,0.1)" }
                        : undefined
                    }
                  >
                    <span className="text-[28px]">{cat.icon}</span>
                    <p className={`text-[12px] font-medium font-nunito leading-tight ${
                      isSelected ? "text-gold" : "text-cream/70"
                    }`}>
                      {cat.nameAz}
                    </p>
                    <p className="text-[9px] text-cream/50 font-nunito">
                      {cat.wordCount} söz
                    </p>
                    {/* Custom word button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomWordModal({ open: true, catId: cat.id, catName: cat.nameAz });
                      }}
                      className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-gold/[0.08] transition-colors"
                      title="Söz əlavə et"
                    >
                      <svg width="8" height="8" viewBox="0 0 20 20">
                        <path d="M10 5v10M5 10h10" stroke="#888" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                    {isSelected && (
                      <motion.div
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 15 }}
                      >
                        <svg width="8" height="8" viewBox="0 0 20 20">
                          <path
                            d="M5 10l3 3 7-7"
                            fill="none"
                            stroke="#C8A44E"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
          <motion.button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-gold text-dark text-[14px] font-medium font-nunito"
            whileTap={{ scale: 0.97 }}
          >
            Təsdiqlə ({current.length} kateqoriya)
          </motion.button>
        </div>
      </motion.div>

      {/* Custom Word Modal */}
      <CustomWordModal
        isOpen={customWordModal.open}
        category={customWordModal.catId}
        categoryName={customWordModal.catName}
        onClose={() => setCustomWordModal({ open: false, catId: "", catName: "" })}
        onWordAdded={() => {
          // Kategoriya sayını yenilə
          setCategories((prev) =>
            prev.map((c) =>
              c.id === customWordModal.catId ? { ...c, wordCount: c.wordCount + 1 } : c
            )
          );
        }}
      />
    </motion.div>
  );
}
