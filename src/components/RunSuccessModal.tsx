"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BADGES, PROGRAM_BONUS_MULTIPLIER } from "@/lib/points";
import { GameModal } from "@/components/ui/GameModal";

type BadgeInfo = { slug: string; name: string; emoji: string; description: string };

export interface RunSuccessResult {
  pointsEarned: number;
  isPersonalRecord: boolean;
  newStreak: number;
  newBadges: string[];
  isProgramRun?: boolean;
}

function PointsCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <span>+{display}</span>;
}

function Particle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      style={{ position: "absolute", top: 0, left: `${x}%`, width: 5, height: 5, background: color, pointerEvents: "none" }}
      initial={{ y: -8, opacity: 1, rotate: 0 }}
      animate={{ y: 280, opacity: 0, rotate: 400 }}
      transition={{ duration: 1.8 + Math.random() * 0.6, delay, ease: "easeIn" }}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id: i, delay: i * 0.04, x: 3 + Math.random() * 94,
    color: ["#c9a227","#e8c547","#f5d76e","#c41e3a","#e8dcc8","#c9a22780"][i % 6],
  }));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 0, overflow: "visible", pointerEvents: "none" }}>
      {particles.map((p) => <Particle key={p.id} delay={p.delay} x={p.x} color={p.color} />)}
    </div>
  );
}

interface Props {
  result: RunSuccessResult;
  onClose: () => void;
}

export function RunSuccessModal({ result, onClose }: Props) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeInfo | null>(null);

  if (selectedBadge) return (
    <GameModal
      title={selectedBadge.name}
      subtitle="Haut Fait Débloqué"
      icon={selectedBadge.emoji}
      iconGlow="#c9a227"
      description={selectedBadge.description}
      actions={[{ label: "Retour", symbol: "←", onClick: () => setSelectedBadge(null), variant: "secondary" }]}
    />
  );

  return (
    <GameModal
      title="Victoire !"
      subtitle="Hauts faits accomplis"
      icon="🏆"
      iconGlow="#c9a227"
      actions={[{ label: "Retour au Panthéon", symbol: "○", onClick: onClose, variant: "primary" }]}
    >
      <div style={{ position: "relative" }}><Confetti /></div>

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
          style={{ fontFamily: "'Cinzel', serif", fontSize: 44, fontWeight: 900, color: "var(--gold)", lineHeight: 1, textShadow: "0 0 30px #c9a22760" }}
        >
          <PointsCounter target={result.pointsEarned} />
        </motion.p>
        <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>Points de Gloire</p>
      </div>

      {result.isProgramRun && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
          style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px", background: "rgba(201,162,39,0.15)", border: "1px solid var(--gold)", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 12, color: "var(--gold)", letterSpacing: "0.06em" }}>
            📋 ×{PROGRAM_BONUS_MULTIPLIER} PROGRAMME 10KM
          </span>
        </motion.div>
      )}

      {result.isPersonalRecord && (
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ display: "inline-block", padding: "4px 14px", background: "linear-gradient(135deg, #c9a227, #f5d76e)", color: "#080706", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em" }}>
            ⚡ NOUVEAU RECORD PERSONNEL
          </span>
        </motion.div>
      )}

      {result.newStreak > 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ textAlign: "center", fontSize: 12, color: "#c41e3a", fontWeight: 700, marginBottom: 8 }}>
          🔥 {result.newStreak} semaine{result.newStreak > 1 ? "s" : ""} de feu !
        </motion.p>
      )}

      {result.newBadges.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <p style={{ textAlign: "center", fontSize: 9, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Haut{result.newBadges.length > 1 ? "s" : ""} Fait{result.newBadges.length > 1 ? "s" : ""} Débloqué{result.newBadges.length > 1 ? "s" : ""} !
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {result.newBadges.map((slug, i) => {
              const badge = BADGES.find((b) => b.slug === slug);
              if (!badge) return null;
              return (
                <motion.div key={slug}
                  initial={{ opacity: 0, scale: 0, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.85 + i * 0.12 }}
                  onClick={() => setSelectedBadge(badge)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 10px", border: "1px solid var(--gold)", background: "rgba(201,162,39,0.08)", minWidth: 64, position: "relative", cursor: "pointer" }}
                >
                  <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
                  <span style={{ fontSize: 22 }}>{badge.emoji}</span>
                  <p style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: "var(--gold)", textAlign: "center", letterSpacing: "0.06em", lineHeight: 1.3 }}>
                    {badge.name.toUpperCase()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </GameModal>
  );
}
