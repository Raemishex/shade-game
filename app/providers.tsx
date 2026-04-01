"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import NavBar from "@/components/layout/NavBar";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <NavBar />
    </ToastProvider>
  );
}
