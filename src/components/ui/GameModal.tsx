"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface GameModalAction {
  label: string;
  symbol?: string;          // ex: "✕" "○" "⚔"
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface Props {
  open?: boolean;           // si false → AnimatePresence cache
  onClose?: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;         // emoji ou image, affiché dans le cadre central
  iconGlow?: string;        // couleur du rayonnement derrière l'icône
  description?: string;
  children?: ReactNode;     // contenu libre sous description
  actions?: GameModalAction[];
  width?: number;
}

// ── Ornaments ─────────────────────────────────────────────────────────────────
function TopOrnament() {
  return (
    <svg width="100%" height="18" viewBox="0 0 320 18" preserveAspectRatio="none" style={{ display: "block" }}>
      {/* left line */}
      <line x1="0" y1="9" x2="126" y2="9" stroke="#c9a22760" strokeWidth="1"/>
      {/* left diamond */}
      <path d="M130 9 L136 4 L142 9 L136 14 Z" fill="#c9a227" opacity="0.7"/>
      {/* center gap */}
      <line x1="148" y1="9" x2="172" y2="9" stroke="#c9a22760" strokeWidth="1"/>
      {/* center star */}
      <path d="M160 4 L162 8 L166 9 L162 10 L160 14 L158 10 L154 9 L158 8 Z" fill="#c9a227"/>
      <line x1="148" y1="9" x2="172" y2="9" stroke="#c9a22760" strokeWidth="1"/>
      {/* right diamond */}
      <path d="M178 9 L184 4 L190 9 L184 14 Z" fill="#c9a227" opacity="0.7"/>
      {/* right line */}
      <line x1="194" y1="9" x2="320" y2="9" stroke="#c9a22760" strokeWidth="1"/>
    </svg>
  );
}

function DividerOrnament() {
  return (
    <svg width="100%" height="14" viewBox="0 0 320 14" preserveAspectRatio="none" style={{ display: "block", margin: "16px 0" }}>
      <line x1="0" y1="7" x2="140" y2="7" stroke="#c9a22750" strokeWidth="0.8"/>
      <path d="M145 7 L151 2 L157 7 L151 12 Z" fill="#c9a227" opacity="0.5"/>
      <line x1="163" y1="7" x2="320" y2="7" stroke="#c9a22750" strokeWidth="0.8"/>
    </svg>
  );
}

// ── Action button (GoW style) ─────────────────────────────────────────────────
const ACTION_STYLES = {
  primary:   { bg: "#c9a227", color: "#080706", border: "none", glow: "#c9a22760" },
  secondary: { bg: "transparent", color: "#8a7a65", border: "1px solid #3d3020", glow: "none" },
  danger:    { bg: "transparent", color: "#c41e3a", border: "1px solid #c41e3a60", glow: "#c41e3a40" },
};

function ActionBtn({ action }: { action: GameModalAction }) {
  const s = ACTION_STYLES[action.variant ?? "secondary"];
  return (
    <motion.button
      onClick={action.onClick}
      disabled={action.disabled}
      whileHover={{ scale: action.disabled ? 1 : 1.05 }}
      whileTap={{ scale: action.disabled ? 1 : 0.96 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "9px 20px",
        background: s.bg,
        color: s.color,
        border: s.border,
        boxShadow: s.glow !== "none" ? `0 0 16px ${s.glow}` : undefined,
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: action.disabled ? "not-allowed" : "pointer",
        opacity: action.disabled ? 0.4 : 1,
        flex: 1,
      }}
    >
      {action.symbol && (
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: action.variant === "primary" ? "rgba(0,0,0,0.25)" : "rgba(201,162,39,0.12)",
          border: `1.5px solid ${action.variant === "primary" ? "rgba(0,0,0,0.3)" : action.variant === "danger" ? "#c41e3a" : "#c9a22760"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, flexShrink: 0,
          color: action.variant === "primary" ? "#080706" : action.variant === "danger" ? "#c41e3a" : "#c9a227",
        }}>
          {action.symbol}
        </span>
      )}
      {action.label}
    </motion.button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GameModal({ open = true, onClose, title, subtitle, icon, iconGlow = "#c9a227", description, children, actions, width = 360 }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(4,3,2,0.88)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Panel — outer frame (fixed, no scroll) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: width,
              maxHeight: "85vh",
              border: "1px solid #c9a22750",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Corner ornaments — always at visual corners */}
            <div style={{ position: "absolute", top: -1, left: -1, width: 20, height: 20, borderTop: "2px solid #c9a227", borderLeft: "2px solid #c9a227", zIndex: 2, pointerEvents: "none" }}/>
            <div style={{ position: "absolute", top: -1, right: -1, width: 20, height: 20, borderTop: "2px solid #c9a227", borderRight: "2px solid #c9a227", zIndex: 2, pointerEvents: "none" }}/>
            <div style={{ position: "absolute", bottom: -1, left: -1, width: 20, height: 20, borderBottom: "2px solid #c9a227", borderLeft: "2px solid #c9a227", zIndex: 2, pointerEvents: "none" }}/>
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 20, height: 20, borderBottom: "2px solid #c9a227", borderRight: "2px solid #c9a227", zIndex: 2, pointerEvents: "none" }}/>

            {/* Scrollable content */}
            <div style={{
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              background: "linear-gradient(180deg, #1a1410 0%, #0e0b08 60%, #0a0806 100%)",
            }}>
            {/* Radial light */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 30%, rgba(201,162,39,0.07) 0%, transparent 65%)",
            }}/>

            <div style={{ padding: "20px 24px 0", position: "relative" }}>
              <TopOrnament />
            </div>

            <div style={{ padding: "12px 28px 0", position: "relative", textAlign: "center" }}>
              {/* Title */}
              <h2 style={{
                fontFamily: "'Cinzel Decorative', serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "0.04em",
                background: "linear-gradient(135deg, #c9a227, #f5d76e, #c9a227)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.2,
                marginBottom: subtitle ? 4 : 12,
              }}>
                {title}
              </h2>

              {subtitle && (
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "#8a7a65", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                  {subtitle}
                </p>
              )}

              {/* Icon box */}
              {icon && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{
                    width: 80, height: 80,
                    border: "1px solid #c9a22760",
                    position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `radial-gradient(ellipse at 50% 50%, ${iconGlow}25 0%, #0e0b08 70%)`,
                  }}>
                    {/* icon box corners */}
                    <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "2px solid #c9a227", borderLeft: "2px solid #c9a227" }}/>
                    <div style={{ position: "absolute", top: -1, right: -1, width: 10, height: 10, borderTop: "2px solid #c9a227", borderRight: "2px solid #c9a227" }}/>
                    <div style={{ position: "absolute", bottom: -1, left: -1, width: 10, height: 10, borderBottom: "2px solid #c9a227", borderLeft: "2px solid #c9a227" }}/>
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "2px solid #c9a227", borderRight: "2px solid #c9a227" }}/>
                    {/* glow behind icon */}
                    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle, ${iconGlow}30 0%, transparent 70%)` }}/>
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      style={{ fontSize: 36, position: "relative" }}
                    >
                      {icon}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Description */}
              {description && (
                <p style={{ fontSize: 13, color: "#8a7a65", lineHeight: 1.7, textAlign: "center", marginBottom: 8 }}>
                  {description}
                </p>
              )}

              {/* Free children */}
              {children && (
                <div style={{ textAlign: "left", marginBottom: 4 }}>
                  {children}
                </div>
              )}
            </div>

            {/* Actions bar */}
            {actions && actions.length > 0 && (
              <div style={{ padding: "0 28px 20px", position: "relative" }}>
                <DividerOrnament />
                <div style={{ display: "flex", gap: 8 }}>
                  {actions.map((a, i) => <ActionBtn key={i} action={a} />)}
                </div>
              </div>
            )}

            {!actions && <div style={{ height: 20 }} />}
            </div>{/* end scrollable */}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
