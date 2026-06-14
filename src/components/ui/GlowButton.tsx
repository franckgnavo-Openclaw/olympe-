"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick?: () => void;
  variant?: "gold" | "red" | "ghost";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  fullWidth?: boolean;
}

const variants = {
  gold: {
    bg: "linear-gradient(135deg, #c9a227, #f5d76e, #c9a227)",
    shadow: "0 0 24px #c9a22770, 0 4px 20px #00000060",
    hoverShadow: "0 0 40px #c9a227aa, 0 4px 30px #00000080",
    color: "#080706",
    border: "none",
  },
  red: {
    bg: "linear-gradient(135deg, #8b1a1a, #c41e3a)",
    shadow: "0 0 20px #c41e3a50, 0 4px 16px #00000060",
    hoverShadow: "0 0 36px #c41e3a80, 0 4px 24px #00000080",
    color: "#e8dcc8",
    border: "none",
  },
  ghost: {
    bg: "transparent",
    shadow: "none",
    hoverShadow: "0 0 20px #c9a22730",
    color: "#c9a227",
    border: "1px solid #c9a22760",
  },
};

export function GlowButton({
  children, onClick, variant = "gold", className = "",
  type = "button", disabled = false, fullWidth = false,
}: Props) {
  const v = variants[variant];
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03, boxShadow: v.hoverShadow }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        background: v.bg,
        boxShadow: v.shadow,
        color: v.color,
        border: v.border,
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "14px 28px",
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: "13px",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
