"use client";
import { useEffect, useState } from "react";

interface Props {
  value: number;   // 0-100
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
}

export function RuneBar({ value, color = "var(--gold)", height = 6, label, showValue }: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, value)), 50);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div style={{ width: "100%" }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {label && <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>{label}</span>}
          {showValue && <span style={{ fontSize: 12, color, fontWeight: 700 }}>{Math.round(value)}%</span>}
        </div>
      )}
      <div style={{
        height,
        background: "var(--surface3)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        position: "relative",
      }}>
        {[25, 50, 75].map(p => (
          <div key={p} style={{
            position: "absolute",
            left: `${p}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--border2)",
            zIndex: 1,
          }} />
        ))}
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 10px ${color}80`,
            transition: "width 1.2s ease-out",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            animation: "shimmer 1.8s ease-in-out infinite",
          }} />
        </div>
      </div>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }`}</style>
    </div>
  );
}
