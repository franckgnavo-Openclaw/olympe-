"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BADGES } from "@/lib/points";
import { GameModal } from "@/components/ui/GameModal";

interface EarnedBadge {
  badge: { slug: string; name: string; emoji: string; description: string };
  earnedAt: string;
}

interface Props {
  earnedBadges: EarnedBadge[];
}

// ── TREE LAYOUT ────────────────────────────────────────────────────────────────
const R  = 20;
const VW = 600;
const VH = 740;

const CX = { c0: 55, c1: 170, c2: 295, c3: 415, c4: 535 };
const RY = [45, 125, 205, 285, 365, 445, 525, 605, 685];

type Col = "c0" | "c1" | "c2" | "c3" | "c4";
type NodeDef = { slug: string; x: number; y: number; col: Col };

const NODES: NodeDef[] = [
  // Root
  { slug: "first-run",       x: CX.c2,      y: RY[0], col: "c2" },
  // ── Distance cumulée ──
  { slug: "5km-total",       x: CX.c0,      y: RY[1], col: "c0" },
  { slug: "10km",            x: CX.c0,      y: RY[2], col: "c0" },
  { slug: "25km-total",      x: CX.c0,      y: RY[3], col: "c0" },
  { slug: "50km-total",      x: CX.c0,      y: RY[4], col: "c0" },
  { slug: "100km",           x: CX.c0,      y: RY[5], col: "c0" },
  { slug: "250km-total",     x: CX.c0,      y: RY[6], col: "c0" },
  { slug: "500km-total",     x: CX.c0,      y: RY[7], col: "c0" },
  { slug: "1000km-total",    x: CX.c0,      y: RY[8], col: "c0" },
  // ── Sortie unique ──
  { slug: "5km-single",      x: CX.c1,      y: RY[1], col: "c1" },
  { slug: "10km-single",     x: CX.c1,      y: RY[2], col: "c1" },
  { slug: "15km-single",     x: CX.c1,      y: RY[3], col: "c1" },
  { slug: "30km-single",     x: CX.c1,      y: RY[4], col: "c1" },
  { slug: "ultra",           x: CX.c1,      y: RY[5], col: "c1" },
  { slug: "half-marathon",   x: CX.c1,      y: RY[6], col: "c1" },
  { slug: "marathon",        x: CX.c1,      y: RY[7], col: "c1" },
  // ── Allure ──
  { slug: "personal-record", x: CX.c2,      y: RY[1], col: "c2" },
  { slug: "sub-6-pace",      x: CX.c2,      y: RY[2], col: "c2" },
  { slug: "sub-5-pace",      x: CX.c2,      y: RY[3], col: "c2" },
  { slug: "sub-4-pace",      x: CX.c2,      y: RY[4], col: "c2" },
  // ── Durée ──
  { slug: "1h-run",          x: CX.c3,      y: RY[1], col: "c3" },
  { slug: "2h-run",          x: CX.c3,      y: RY[2], col: "c3" },
  // ── Régularité ──
  { slug: "streak-2",        x: CX.c4,      y: RY[1], col: "c4" },
  { slug: "streak-4",        x: CX.c4,      y: RY[2], col: "c4" },
  { slug: "streak-7",        x: CX.c4,      y: RY[3], col: "c4" },
  { slug: "streak-12",       x: CX.c4,      y: RY[4], col: "c4" },
  { slug: "week-3runs",      x: CX.c4 - 32, y: RY[5], col: "c4" },
  { slug: "week-5runs",      x: CX.c4 + 32, y: RY[5], col: "c4" },
  { slug: "10-runs",         x: CX.c4 - 32, y: RY[6], col: "c4" },
  { slug: "50-runs",         x: CX.c4 + 32, y: RY[6], col: "c4" },
  { slug: "100-runs",        x: CX.c4 - 32, y: RY[7], col: "c4" },
  { slug: "month-10runs",    x: CX.c4 + 32, y: RY[7], col: "c4" },
];

const EDGES: [string, string][] = [
  // Root → branches
  ["first-run", "5km-total"],
  ["first-run", "5km-single"],
  ["first-run", "personal-record"],
  ["first-run", "1h-run"],
  ["first-run", "streak-2"],
  // Distance chain
  ["5km-total",    "10km"],
  ["10km",         "25km-total"],
  ["25km-total",   "50km-total"],
  ["50km-total",   "100km"],
  ["100km",        "250km-total"],
  ["250km-total",  "500km-total"],
  ["500km-total",  "1000km-total"],
  // Sortie unique chain
  ["5km-single",   "10km-single"],
  ["10km-single",  "15km-single"],
  ["15km-single",  "30km-single"],
  ["30km-single",  "ultra"],
  ["ultra",        "half-marathon"],
  ["half-marathon","marathon"],
  // Allure chain
  ["personal-record", "sub-6-pace"],
  ["sub-6-pace",      "sub-5-pace"],
  ["sub-5-pace",      "sub-4-pace"],
  // Durée chain
  ["1h-run", "2h-run"],
  // Régularité chain
  ["streak-2",  "streak-4"],
  ["streak-4",  "streak-7"],
  ["streak-7",  "streak-12"],
  ["streak-12", "week-3runs"],
  ["streak-12", "week-5runs"],
  ["week-3runs","10-runs"],
  ["week-5runs","50-runs"],
  ["10-runs",   "100-runs"],
  ["50-runs",   "month-10runs"],
];

const BOTTOM_SECTIONS: { label: string; slugs: string[] }[] = [
  {
    label: "MOMENTS & PRESTIGE",
    slugs: [
      "early-bird", "night-runner", "noon-runner", "comeback",
      "month-20runs",
      "100-points", "500-points", "1000-points", "5000-points", "10000-points", "level-5",
    ],
  },
  {
    label: "PROGRAMME 10KM",
    slugs: ["program-first", "program-week1", "program-10", "program-halfway", "program-complete"],
  },
];

const COL_COLOR: Record<Col, string> = {
  c0: "#4a90d9",
  c1: "#9b59b6",
  c2: "#c9a227",
  c3: "#27a96b",
  c4: "#c41e3a",
};
const COL_LABEL: Record<Col, string> = {
  c0: "DISTANCE",
  c1: "SORTIE",
  c2: "ALLURE",
  c3: "DURÉE",
  c4: "RÉGULARITÉ",
};

const COLS: Col[] = ["c0", "c1", "c2", "c3", "c4"];

function getNode(slug: string) { return NODES.find((n) => n.slug === slug); }
function getBadge(slug: string) { return BADGES.find((b) => b.slug === slug); }

function Pulse({ x1, y1, x2, y2, delay, color }: { x1: number; y1: number; x2: number; y2: number; delay: number; color: string }) {
  return (
    <motion.circle r={3} fill={color} fillOpacity={0.9}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: "linear" }}
    />
  );
}

export function BadgeTree({ earnedBadges }: Props) {
  const [selected, setSelected] = useState<{ slug: string } | null>(null);

  const earnedMap = new Map<string, string>();
  for (const eb of earnedBadges) earnedMap.set(eb.badge.slug, eb.earnedAt);
  const earnedSlugs = new Set(earnedMap.keys());

  const selectedBadge = selected ? getBadge(selected.slug) : null;
  const selectedDate   = selected ? earnedMap.get(selected.slug) : undefined;
  const selectedEarned = selected ? earnedSlugs.has(selected.slug) : false;
  const selectedNode   = selected ? getNode(selected.slug) : null;

  function handleNodeClick(slug: string) {
    setSelected(prev => prev?.slug === slug ? null : { slug });
  }

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", marginBottom: 4, padding: "0 4px" }}>
        {COLS.map((col) => (
          <p key={col} style={{ textAlign: "center", fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: "0.12em", color: COL_COLOR[col] }}>
            {COL_LABEL[col]}
          </p>
        ))}
      </div>

      {/* Main SVG tree */}
      <div style={{ background: "radial-gradient(ellipse at 50% 10%, #121624 0%, #080706 100%)", border: "1px solid #1e1a17", position: "relative" }}>
        {/* Stone cracks */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none" }} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
          <path d="M55 0 L70 200 L45 450 L65 700" stroke="#8a7a65" strokeWidth="1" fill="none"/>
          <path d="M170 0 L185 300 L160 600" stroke="#8a7a65" strokeWidth="0.7" fill="none"/>
          <path d="M295 0 L310 350 L285 700" stroke="#8a7a65" strokeWidth="0.8" fill="none"/>
          <path d="M415 0 L400 250 L420 500" stroke="#8a7a65" strokeWidth="0.6" fill="none"/>
          <path d="M535 0 L520 300 L545 600" stroke="#8a7a65" strokeWidth="0.9" fill="none"/>
        </svg>

        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            {COLS.map((col) => (
              <filter key={col} id={`glow-${col}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            ))}
            {COLS.map((col) => (
              <radialGradient key={col} id={`bg-${col}`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor={COL_COLOR[col]} stopOpacity="0.18"/>
                <stop offset="100%" stopColor="#080706" stopOpacity="0.95"/>
              </radialGradient>
            ))}
            <radialGradient id="bg-locked" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#141210"/>
              <stop offset="100%" stopColor="#080706"/>
            </radialGradient>
          </defs>

          {/* Edges */}
          {EDGES.map(([fromSlug, toSlug], i) => {
            const from = getNode(fromSlug);
            const to   = getNode(toSlug);
            if (!from || !to) return null;
            const dx = to.x - from.x, dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / dist, uy = dy / dist;
            const x1 = from.x + ux * R, y1 = from.y + uy * R;
            const x2 = to.x   - ux * R, y2 = to.y   - uy * R;
            const color = COL_COLOR[to.col];
            const bothEarned = earnedSlugs.has(fromSlug) && earnedSlugs.has(toSlug);
            return (
              <g key={i}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0a0908" strokeWidth={3}/>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={bothEarned ? color : "#1e1a17"} strokeWidth={bothEarned ? 2 : 1.5}/>
                {bothEarned && (
                  <>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1} strokeOpacity={0.4} filter={`url(#glow-${to.col})`}/>
                    <Pulse x1={x1} y1={y1} x2={x2} y2={y2} delay={i * 0.3} color={color}/>
                  </>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node, i) => {
            const earned = earnedSlugs.has(node.slug);
            const badge  = getBadge(node.slug);
            const color  = COL_COLOR[node.col];
            const isRoot = node.slug === "first-run";
            const active = selected?.slug === node.slug;

            return (
              <motion.g
                key={node.slug}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 220, damping: 18 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px`, cursor: "pointer" }}
                onClick={() => handleNodeClick(node.slug)}
              >
                {earned && (
                  <motion.circle cx={node.x} cy={node.y} r={R + 8} fill="none" stroke={color} strokeWidth={1}
                    animate={{ r: [R + 6, R + 12, R + 6], opacity: [0.35, 0.08, 0.35] }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                )}
                {active && <circle cx={node.x} cy={node.y} r={R + 5} fill="none" stroke="#ffffff" strokeWidth={1.5} strokeOpacity={0.6}/>}
                <circle cx={node.x} cy={node.y} r={R + 2} fill="none"
                  stroke={earned ? color : "#1e1a17"} strokeWidth={earned ? 1.5 : 1}
                  filter={earned ? `url(#glow-${node.col})` : undefined}
                />
                <circle cx={node.x} cy={node.y} r={R}
                  fill={earned ? `url(#bg-${node.col})` : "url(#bg-locked)"}
                  stroke={earned ? color : "#2a2420"} strokeWidth={1.5}
                />
                <circle cx={node.x} cy={node.y} r={R - 6} fill="none"
                  stroke={earned ? color : "#1e1a17"} strokeWidth={0.7}
                  strokeDasharray={earned ? "3 3" : "2 4"} strokeOpacity={earned ? 0.5 : 0.25}
                />
                {isRoot && <circle cx={node.x} cy={node.y} r={R + 7} fill="none" stroke="#c9a22750" strokeWidth={0.8} strokeDasharray="4 3"/>}
                <text
                  x={node.x} y={node.y + 5}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={isRoot ? 15 : 13}
                  opacity={earned ? 1 : 0.2}
                >
                  {badge?.emoji ?? "?"}
                </text>
                {!earned && (
                  <text x={node.x + R - 4} y={node.y + R - 2} fontSize={8} textAnchor="middle" fill="#2a2420">🔒</text>
                )}
                <text x={node.x} y={node.y + R + 12} textAnchor="middle"
                  fill={earned ? color : "#2a2010"} fontSize={6.5}
                  fontFamily="Cinzel, serif" letterSpacing="0.05em"
                >
                  {(badge?.name ?? node.slug).toUpperCase()}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Bottom sections: Moments, Prestige, Programme */}
      {BOTTOM_SECTIONS.map((section, si) => (
        <div key={section.label} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }}/>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>{section.label}</span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {section.slugs.map((slug, i) => {
              const earned = earnedSlugs.has(slug);
              const badge  = getBadge(slug);
              const active = selected?.slug === slug;
              if (!badge) return null;
              return (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + si * 0.1 + i * 0.04 }}
                  onClick={() => handleNodeClick(slug)}
                  style={{
                    background: active ? "rgba(201,162,39,0.12)" : earned ? "rgba(201,162,39,0.07)" : "var(--surface)",
                    border: `1px solid ${active ? "var(--gold)" : earned ? "#c9a22760" : "var(--border)"}`,
                    padding: "10px 6px", textAlign: "center", position: "relative",
                    opacity: earned ? 1 : 0.35, cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  {earned && <div style={{ position: "absolute", top: -1, left: -1, width: 7, height: 7, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }}/>}
                  <div style={{ fontSize: 18, marginBottom: 4, filter: earned ? "none" : "grayscale(1) brightness(0.3)" }}>{badge.emoji}</div>
                  <p style={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: earned ? "var(--gold)" : "var(--muted2)", lineHeight: 1.3, letterSpacing: "0.04em" }}>
                    {badge.name.toUpperCase()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
        {COLS.map((col) => (
          <div key={col} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", border: `1.5px solid ${COL_COLOR[col]}`, boxShadow: `0 0 5px ${COL_COLOR[col]}80` }}/>
            <span style={{ fontSize: 8, color: COL_COLOR[col], fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>{COL_LABEL[col]}</span>
          </div>
        ))}
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <GameModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selectedBadge.name}
          subtitle={
            selectedEarned
              ? `Débloqué le ${new Date(selectedDate!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
              : "Haut Fait Verrouillé"
          }
          icon={selectedBadge.emoji}
          iconGlow={selectedEarned ? (selectedNode ? COL_COLOR[selectedNode.col] : "#c9a227") : "#2a2420"}
          description={selectedBadge.description}
          actions={[{ label: "Fermer", symbol: "○", onClick: () => setSelected(null), variant: selectedEarned ? "primary" : "secondary" }]}
        />
      )}
    </div>
  );
}
