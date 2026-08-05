"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Wraps page content dengan fade/slide ringan setiap pathname berubah.
 * Tidak memakai AnimatePresence/exit — `key={pathname}` memaksa remount,
 * jadi anak baru selalu di-mount & dianimasi ke opacity 1. Ini menghindari
 * bug App Router di mana mode="wait" bisa membuat halaman tampil kosong
 * sampai di-refresh.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
