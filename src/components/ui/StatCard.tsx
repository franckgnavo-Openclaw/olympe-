"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: string;
  delay?: number;
}

export function StatCard({ label, value, unit, icon, color = "var(--gold)", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        padding: "20px 16px",
        position: "relative",
        overflow: "hidden",
      }}
      whileHover={{ borderColor: color, boxShadow: `0 0 20px ${color}20` }}
    >
      {/* Corner ornaments */}
      <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />

      {/* Background glow */}
      <div style={{
        position: "absolute",
        bottom: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}15, transparent)`,
        pointerEvents: "none",
      }} />

      {icon && <div style={{ fontSize: 20, marginBottom: 8, color }}>{icon}</div>}
      <p style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1, fontFamily: "'Cinzel', serif" }}>
        {value}
      </p>
      {unit && <p style={{ fontSize: 11, color: "var(--muted2)", marginTop: 4 }}>{unit}</p>}
    </motion.div>
  );
}
