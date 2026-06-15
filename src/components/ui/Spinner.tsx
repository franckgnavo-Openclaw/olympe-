"use client";

import { motion } from "framer-motion";

interface SpinnerProps {
  size?: number;
  label?: string;
  fullPage?: boolean;
}

export function Spinner({ size = 32, label = "CHARGEMENT", fullPage = false }: SpinnerProps) {
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: `2px solid var(--border2)`,
            borderTopColor: "var(--gold)",
          }}
        />
        {/* Inner pulse */}
        <motion.div
          animate={{ scale: [0.6, 0.9, 0.6], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: size * 0.25,
            borderRadius: "50%",
            background: "var(--gold)",
          }}
        />
      </div>
      {label && (
        <span style={{
          color: "var(--muted)",
          fontFamily: "'Cinzel', serif",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}>
          {label}
        </span>
      )}
    </div>
  );

  if (!fullPage) return inner;

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {inner}
    </div>
  );
}
