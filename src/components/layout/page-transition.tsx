"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAnimation } from "@/lib/animations";

/**
 * Wraps page content dengan fade/slide transition setiap pathname berubah.
 * Client component — dipakai di layout (app).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={getAnimation({ opacity: 0, y: 4 })}
        animate={getAnimation({ opacity: 1, y: 0 })}
        exit={getAnimation({ opacity: 0, y: -2 })}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
