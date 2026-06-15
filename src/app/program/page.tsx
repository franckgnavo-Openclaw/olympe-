"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { GameModal } from "@/components/ui/GameModal";
import { Spinner } from "@/components/ui/Spinner";
import { RunSuccessModal, RunSuccessResult } from "@/components/RunSuccessModal";
import { PROGRAMS, PROGRAM_ID, TYPE_META, SessionType, ProgramSession } from "@/lib/program";

interface UserSession {
  day: number;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  feeling?: number;
  runId?: string | null;
}

const PROGRAM_STORAGE_KEY = "olympe_selected_program";

const RUN_TYPES: SessionType[] = ["Endurance", "Intervalles", "Récupération", "Compétition"];
const isRunType = (t: SessionType) => RUN_TYPES.includes(t);

function getModalTitle(s: ProgramSession): string {
  if (s.type === "Renforcement") return "Renforcement libre";
  if (s.type === "Croisé") return "Entraînement croisé";
  if (s.type === "Endurance") return "Endurance";
  if (s.type === "Intervalles") return "Fractionné";
  if (s.type === "Récupération") return "Récupération active";
  if (s.type === "Compétition") return `Course — ${s.description}`;
  return s.description;
}

// ── Zones ────────────────────────────────────────────────────────────────────
const ZONES = [
  { z: 1, name: "Effort facile",         fc: "50–70 %", allure: "basse",          tip: "Tu peux tenir une conversation complète sans être essoufflé.",       color: "#7ab648" },
  { z: 2, name: "Effort modéré",         fc: "70–80 %", allure: "modérée",        tip: "Tu peux parler, mais tes phrases sont courtes.",                      color: "#c9a227" },
  { z: 3, name: "Effort difficile",      fc: "80–90 %", allure: "soutenue",       tip: "Deux ou trois mots à la fois — le souffle manque rapidement.",        color: "#d4732a" },
  { z: 4, name: "Effort très difficile", fc: "90–95 %", allure: "rapide",         tip: "Quelques mots seulement — tu reprends ton souffle entre chacun.",     color: "#c44b1a" },
  { z: 5, name: "Effort maximal",        fc: "95–100 %", allure: "très rapide",   tip: "La dernière chose que tu veux, c'est de parler.",                    color: "#c41e3a" },
];

// ── Block parser ─────────────────────────────────────────────────────────────
interface Block { reps: number; durMin: number; durSec: number; zone: number }

function parseBlocks(desc: string): Block[] {
  if (!desc || desc === "—") return [];
  return desc.split("+").map(s => s.trim()).flatMap(part => {
    // "N×M'' @ ZX" — secondes
    let m = part.match(/^(\d+)[×x](\d+)''[\s@]*[Zz](\d+)$/i);
    if (m) return [{ reps: +m[1], durMin: 0, durSec: +m[2], zone: +m[3] }];
    // "N×M' @ ZX" — minutes avec reps
    m = part.match(/^(\d+)[×x](\d+)'[\s@]*[Zz](\d+)$/i);
    if (m) return [{ reps: +m[1], durMin: +m[2], durSec: 0, zone: +m[3] }];
    // "M' @ ZX" — minutes seules
    m = part.match(/^(\d+)'[\s@]*[Zz](\d+)$/i);
    if (m) return [{ reps: 1, durMin: +m[1], durSec: 0, zone: +m[2] }];
    return [] as Block[];
  }).filter(b => b.zone >= 1 && b.zone <= 5);
}

function durLabel(b: Block): string {
  if (b.durSec > 0) return `${b.durSec} sec`;
  return `${b.durMin} min`;
}

// Affichage compact dans la carte
function BlocksCompact({ blocks }: { blocks: Block[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {blocks.map((b, i) => {
        const zone = ZONES[b.zone - 1];
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text)" }}>
            {i > 0 && <span style={{ color: "var(--muted2)", fontSize: 10 }}>+</span>}
            <span style={{ fontWeight: 500 }}>
              {b.reps > 1 ? `${b.reps} × ${durLabel(b)}` : durLabel(b)}
            </span>
            <span style={{ fontSize: 9, padding: "1px 5px", background: `${zone.color}22`, border: `1px solid ${zone.color}55`, color: zone.color, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
              Z{b.zone}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// Affichage détaillé dans la modale
function BlocksDetailed({ blocks }: { blocks: Block[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {blocks.map((b, i) => {
        const zone = ZONES[b.zone - 1];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: `${zone.color}0e`, border: `1px solid ${zone.color}35`, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: zone.color }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, marginBottom: 2 }}>
                {b.reps > 1
                  ? `${b.reps} répétitions de ${durLabel(b)}`
                  : durLabel(b)}
              </p>
              <p style={{ fontSize: 11, color: zone.color }}>{zone.name} · FC {zone.fc}</p>
            </div>
            <span style={{ fontSize: 11, padding: "3px 9px", background: `${zone.color}22`, border: `1px solid ${zone.color}55`, color: zone.color, fontFamily: "'Cinzel', serif", fontWeight: 700, flexShrink: 0 }}>
              Z{b.zone}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Légende des zones
function ZoneLegend() {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>ZONES D'INTENSITÉ</span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {ZONES.map(z => (
          <div key={z.z} style={{ display: "flex", gap: 14, padding: "11px 14px 11px 17px", background: "var(--surface)", border: `1px solid ${z.color}25`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: z.color }} />
            <div style={{ flexShrink: 0, width: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 900, fontSize: 16, color: z.color, lineHeight: 1 }}>Z{z.z}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3, gap: 8 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "var(--text)", fontWeight: 700 }}>{z.name}</span>
                <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0, fontFamily: "'Cinzel', serif" }}>FC {z.fc}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5, flex: 1 }}>{z.tip}</p>
                <span style={{ fontSize: 10, color: z.color, flexShrink: 0, fontStyle: "italic", alignSelf: "flex-start" }}>allure {z.allure}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeelingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
          background: n <= value ? "var(--gold)" : "var(--surface3)",
          fontSize: 10, color: n <= value ? "#080706" : "var(--muted2)",
          fontFamily: "'Cinzel', serif", fontWeight: 700,
          transition: "background 0.15s",
        }}>{n}</button>
      ))}
    </div>
  );
}

export default function ProgramPage() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedProgramId, setSelectedProgramId] = useState<string>(PROGRAM_ID);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [activeWeek, setActiveWeek] = useState(1);
  const [selected, setSelected] = useState<ProgramSession | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalFeeling, setModalFeeling] = useState(0);
  const [modalDistance, setModalDistance] = useState("");
  const [modalDuration, setModalDuration] = useState("");
  const [modalPaceMin, setModalPaceMin] = useState("");
  const [modalPaceSec, setModalPaceSec] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const [runSuccess, setRunSuccess] = useState<RunSuccessResult | null>(null);

  const program = PROGRAMS[selectedProgramId] ?? PROGRAMS[PROGRAM_ID];
  const SESSIONS = program.sessions;
  const WEEK_DURATIONS = program.weekDurations;
  const WEEKS = Array.from({ length: program.weeks }, (_, i) => i + 1);

  // Restore selected program from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PROGRAM_STORAGE_KEY);
    if (saved && PROGRAMS[saved]) setSelectedProgramId(saved);
  }, []);

  function switchProgram(id: string) {
    setSelectedProgramId(id);
    localStorage.setItem(PROGRAM_STORAGE_KEY, id);
    setShowProgramSelector(false);
    setActiveWeek(1);
    setUserSessions([]);
    setInitialLoading(true);
    fetch(`/api/program?programId=${id}`)
      .then(r => r.json())
      .then(setUserSessions)
      .finally(() => setInitialLoading(false));
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      setInitialLoading(true);
      fetch(`/api/program?programId=${selectedProgramId}`)
        .then(r => r.json())
        .then(setUserSessions)
        .finally(() => setInitialLoading(false));
    }
  }, [status, selectedProgramId]);

  // Find current week = first week with incomplete non-rest sessions
  useEffect(() => {
    const doneSet = new Set(userSessions.filter(s => s.completed).map(s => s.day));
    for (let w = 1; w <= program.weeks; w++) {
      const weekSessions = SESSIONS.filter(s => s.week === w && s.type !== "Repos");
      if (weekSessions.some(s => !doneSet.has(s.day))) {
        setActiveWeek(w);
        return;
      }
    }
    setActiveWeek(program.weeks);
  }, [userSessions, SESSIONS, program.weeks]);

  const doneMap = new Map(userSessions.map(s => [s.day, s]));

  const completedCount = userSessions.filter(s => s.completed).length;
  const totalActive = SESSIONS.filter(s => s.type !== "Repos").length;
  const pct = Math.round((completedCount / totalActive) * 100);

  // Recalcule la distance à partir de l'allure (min:sec/km) et de la durée
  function recomputeModalDistance(pMin: string, pSec: string, dur: string) {
    const m = parseInt(pMin) || 0;
    const s = parseInt(pSec) || 0;
    const t = parseFloat(dur);
    const paceDec = m + s / 60;
    setModalDistance(paceDec > 0 && t > 0 ? (t / paceDec).toFixed(2) : "");
  }

  function openSession(s: ProgramSession) {
    if (s.type === "Repos") return;
    const existing = doneMap.get(s.day);
    setModalNotes(existing?.notes ?? "");
    setModalFeeling(existing?.feeling ?? 0);
    setModalDistance("");
    setModalDuration(s.durationMin ? String(s.durationMin) : "");
    setModalPaceMin("");
    setModalPaceSec("");
    setModalError("");
    setSelected(s);
  }

  async function toggleDone(completed: boolean) {
    if (!selected) return;

    if (completed && isRunType(selected.type)) {
      const dist = parseFloat(modalDistance);
      if (!modalDistance || dist <= 0) {
        setModalError("Indique l'allure (min/km) pour calculer la distance et enregistrer la séance.");
        return;
      }
    }

    setSaving(true);
    setModalError("");
    const pendingRunResult: { pointsEarned: number; isPersonalRecord: boolean; newStreak: number; runBadges: string[] } = {
      pointsEarned: 0, isPersonalRecord: false, newStreak: 1, runBadges: [],
    };
    try {
      let runId: string | null = null;

      if (completed && isRunType(selected.type)) {
        // 1. Créer le run en premier pour récupérer son id
        const dist = parseFloat(modalDistance);
        const dur = parseInt(modalDuration) || selected.durationMin || 0;
        if (dist > 0 && dur > 0) {
          const runRes = await fetch("/api/runs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: new Date().toISOString().split("T")[0],
              distanceKm: dist,
              durationMin: dur,
              notes: modalNotes,
              feeling: modalFeeling || undefined,
              isProgramRun: true,
            }),
          });
          if (runRes.ok) {
            const runData = await runRes.json();
            runId = runData.run?.id ?? null;
            Object.assign(pendingRunResult, {
              pointsEarned: runData.pointsEarned ?? 0,
              isPersonalRecord: runData.isPersonalRecord ?? false,
              newStreak: runData.newStreak ?? 1,
              runBadges: runData.newBadges ?? [],
            });
          } else {
            setModalError("Erreur lors de l'enregistrement du run.");
            setSaving(false);
            return;
          }
        }
      } else if (!completed) {
        // Marquer non fait : supprimer le run associé (XP + badges révoqués automatiquement)
        const existing = doneMap.get(selected.day);
        if (existing?.runId) {
          await fetch(`/api/runs/${existing.runId}`, { method: "DELETE" });
        }
      }

      // 2. Mettre à jour la séance programme
      const res = await fetch("/api/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgramId,
          day: selected.day,
          completed,
          notes: modalNotes,
          feeling: modalFeeling || undefined,
          runId,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUserSessions(prev => {
          const next = prev.filter(s => s.day !== selected.day);
          return [...next, updated];
        });
        setSelected(null);
        if (updated.completionBonus > 0) {
          setShowCompletion(true);
        } else if (completed) {
          const allNewBadges = [...new Set([...pendingRunResult.runBadges, ...(updated.newBadges ?? [])])];
          setRunSuccess({
            pointsEarned: pendingRunResult.pointsEarned,
            isPersonalRecord: pendingRunResult.isPersonalRecord,
            newStreak: pendingRunResult.newStreak,
            newBadges: allNewBadges,
            isProgramRun: true,
          });
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setModalError(err.error ?? "Erreur lors de la validation");
      }
    } catch {
      setModalError("Erreur réseau, réessaie.");
    } finally {
      setSaving(false);
    }
  }

  const selectedDone = selected ? doneMap.get(selected.day)?.completed ?? false : false;

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 100 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
            {/* Sélecteur de programme */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <button
                onClick={() => setShowProgramSelector(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  padding: "8px 14px", cursor: "pointer", width: "100%",
                  fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--gold)",
                  letterSpacing: "0.12em", textTransform: "uppercase",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                <span style={{ flex: 1, textAlign: "left" }}>{program.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {showProgramSelector && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}>
                  {Object.values(PROGRAMS).map(p => (
                    <button
                      key={p.id}
                      onClick={() => switchProgram(p.id)}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "12px 14px", cursor: "pointer", border: "none",
                        background: p.id === selectedProgramId ? "var(--surface3)" : "transparent",
                        fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.08em",
                        color: p.id === selectedProgramId ? "var(--gold)" : "var(--text)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {p.label}
                      <span style={{ display: "block", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
                        {p.weeks} semaines · {p.sessions.filter(s => s.type !== "Repos").length} séances
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 22,
              background: "linear-gradient(135deg, #c9a227, #f5d76e)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 16,
            }}>
              {program.label.toUpperCase()}
            </h1>

            {/* Global progress */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 18px", position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--gold)", letterSpacing: "0.08em" }}>PROGRESSION GLOBALE</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 13, color: "var(--gold)" }}>{pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--surface3)", position: "relative", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ position: "absolute", inset: "0 auto 0 0", background: "linear-gradient(90deg, #c9a227, #f5d76e)", height: "100%" }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                {completedCount} séances accomplies · {program.weeks} semaines · {SESSIONS.length} jours
              </p>
            </div>
          </motion.div>

          {/* Initial loading */}
          {initialLoading && <Spinner fullPage label="INVOCATION" />}

          {/* Week tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {WEEKS.map(w => {
              const weekSessions = SESSIONS.filter(s => s.week === w && s.type !== "Repos");
              const weekDone = weekSessions.filter(s => doneMap.get(s.day)?.completed).length;
              const weekComplete = weekDone === weekSessions.length;
              const isActive = activeWeek === w;
              return (
                <button key={w} onClick={() => setActiveWeek(w)} style={{
                  flexShrink: 0, padding: "7px 14px",
                  background: isActive ? "var(--gold)" : weekComplete ? "rgba(201,162,39,0.1)" : "var(--surface)",
                  border: `1px solid ${isActive ? "var(--gold)" : weekComplete ? "var(--gold)" : "var(--border)"}`,
                  color: isActive ? "#080706" : weekComplete ? "var(--gold)" : "var(--muted)",
                  fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11,
                  letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s",
                }}>
                  S{w} {weekComplete ? "✓" : ""}
                </button>
              );
            })}
          </div>

          {/* Week header */}
          <AnimatePresence mode="wait">
            <motion.div key={activeWeek}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 14, color: "var(--text)", letterSpacing: "0.08em" }}>
                  SEMAINE {activeWeek}
                </h2>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {WEEK_DURATIONS[activeWeek]} d'entraînement
                </span>
              </div>

              {/* Sessions list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SESSIONS.filter(s => s.week === activeWeek).map((s, i) => {
                  const meta = TYPE_META[s.type];
                  const done = doneMap.get(s.day);
                  const isCompleted = done?.completed ?? false;
                  const isRest = s.type === "Repos";
                  const isComp = s.type === "Compétition";

                  return (
                    <motion.div
                      key={s.day}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openSession(s)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        background: isCompleted ? `${meta.color}10` : isComp ? "rgba(201,162,39,0.06)" : "var(--surface)",
                        border: `1px solid ${isCompleted ? meta.color + "50" : isComp ? "var(--gold)" : "var(--border)"}`,
                        cursor: isRest ? "default" : "pointer",
                        transition: "all 0.15s",
                        opacity: isRest ? 0.5 : 1,
                        position: "relative",
                      }}
                    >
                      {isCompleted && <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: `1px solid ${meta.color}`, borderLeft: `1px solid ${meta.color}` }} />}

                      {/* Day number */}
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--muted2)", width: 28, flexShrink: 0, textAlign: "center" }}>
                        J{s.day}
                      </span>

                      {/* Type badge */}
                      <span style={{
                        fontSize: 9, padding: "2px 7px",
                        background: `${meta.color}20`,
                        border: `1px solid ${meta.color}50`,
                        color: meta.color,
                        fontFamily: "'Cinzel', serif", fontWeight: 700,
                        letterSpacing: "0.06em", flexShrink: 0,
                      }}>
                        {meta.emoji} {meta.short}
                      </span>

                      {/* Description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {(() => {
                          if (isRest) return <p style={{ fontSize: 13, color: "var(--muted2)" }}>Repos</p>;
                          if (isComp) return <p style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Cinzel', serif", fontWeight: 700 }}>{s.description}</p>;
                          if (s.type === "Renforcement") return <p style={{ fontSize: 13, color: "var(--text)" }}>Renforcement libre</p>;
                          if (s.type === "Croisé") return <p style={{ fontSize: 13, color: "var(--text)" }}>Entraînement croisé</p>;
                          const blocks = parseBlocks(s.description);
                          return blocks.length > 0
                            ? <BlocksCompact blocks={blocks} />
                            : <p style={{ fontSize: 13, color: "var(--text)" }}>{s.description}</p>;
                        })()}
                        {done?.feeling && (
                          <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>
                            Ressenti : {done.feeling}/10
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      {s.durationMin && (
                        <span style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>
                          {s.durationMin}'
                        </span>
                      )}

                      {/* Check — masqué pour les repos */}
                      {!isRest && (
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          border: `1.5px solid ${isCompleted ? meta.color : "var(--border2)"}`,
                          background: isCompleted ? meta.color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11,
                        }}>
                          {isCompleted ? <span style={{ color: "#080706", fontWeight: 700 }}>✓</span> : null}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <ZoneLegend />
        </div>
      </main>

      {/* Session modal */}
      <GameModal
        open={!!selected}
        onClose={() => { setSelected(null); setModalError(""); }}
        title={selected ? getModalTitle(selected) : ""}
        subtitle={selected ? `Jour ${selected.day} · Semaine ${selected.week}` : ""}
        icon={selected ? TYPE_META[selected.type].emoji : undefined}
        iconGlow={selected ? TYPE_META[selected.type].color : undefined}
        actions={[
          { label: "Fermer", symbol: "✕", onClick: () => { setSelected(null); setModalError(""); }, variant: "secondary" },
          ...(selectedDone
            ? [{ label: saving ? "..." : "Marquer non fait", symbol: "↩", onClick: () => toggleDone(false), variant: "danger" as const, disabled: saving }]
            : [{ label: saving ? "..." : "Séance accomplie !", symbol: "✓", onClick: () => toggleDone(true), variant: "primary" as const, disabled: saving }]
          ),
        ]}
      >
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {modalError && (
              <div style={{ padding: "8px 12px", background: "rgba(196,30,58,0.15)", border: "1px solid #c41e3a60", color: "#c41e3a", fontSize: 12 }}>
                {modalError}
              </div>
            )}

            {/* Type + durée */}
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{
                fontSize: 10, padding: "3px 10px",
                background: `${TYPE_META[selected.type].color}20`,
                border: `1px solid ${TYPE_META[selected.type].color}60`,
                color: TYPE_META[selected.type].color,
                fontFamily: "'Cinzel', serif", letterSpacing: "0.08em",
              }}>
                {selected.type.toUpperCase()}
              </span>
              {selected.durationMin && (
                <span style={{ fontSize: 10, padding: "3px 10px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", fontFamily: "'Cinzel', serif" }}>
                  {selected.durationMin} MIN
                </span>
              )}
            </div>

            {/* Description contextuelle pour Renforcement / Croisé */}
            {(selected.type === "Renforcement" || selected.type === "Croisé") && (
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                {selected.type === "Renforcement"
                  ? "Séance de renforcement musculaire libre. Marque-la comme accomplie une fois terminée."
                  : "Séance croisée — vélo, natation, yoga… Toute activité non-course compte."}
              </p>
            )}

            {/* Blocs détaillés pour les séances de run */}
            {isRunType(selected.type) && (() => {
              const blocks = parseBlocks(selected.description);
              return blocks.length > 0 ? <BlocksDetailed blocks={blocks} /> : null;
            })()}

            {/* Durée → Allure → Distance auto — uniquement pour les séances de run */}
            {isRunType(selected.type) && !selectedDone && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Durée — pré-remplie, éditable */}
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Durée (min){selected.durationMin ? " · pré-remplie" : ""}
                  </p>
                  <input
                    type="number" min="1"
                    value={modalDuration}
                    onChange={e => { setModalDuration(e.target.value); recomputeModalDistance(modalPaceMin, modalPaceSec, e.target.value); }}
                    placeholder="30"
                    className="game-input"
                    style={{ width: "100%", padding: "8px 10px", background: "rgba(201,162,39,0.04)", border: `1px solid ${selected.durationMin ? "var(--gold)" : "#3d3020"}`, color: "var(--text)", fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none" }}
                  />
                </div>
                {/* Allure */}
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Allure (min/km) *
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number" min="0" max="59" value={modalPaceMin}
                      onChange={e => { setModalPaceMin(e.target.value); recomputeModalDistance(e.target.value, modalPaceSec, modalDuration); }}
                      placeholder="5" className="game-input"
                      style={{ width: "100%", padding: "8px 10px", textAlign: "center", background: "rgba(201,162,39,0.06)", border: "1px solid var(--gold)", color: "var(--text)", fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none" }}
                    />
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>:</span>
                    <input
                      type="number" min="0" max="59" value={modalPaceSec}
                      onChange={e => { setModalPaceSec(e.target.value); recomputeModalDistance(modalPaceMin, e.target.value, modalDuration); }}
                      placeholder="30" className="game-input"
                      style={{ width: "100%", padding: "8px 10px", textAlign: "center", background: "rgba(201,162,39,0.06)", border: "1px solid var(--gold)", color: "var(--text)", fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>MIN/KM</span>
                  </div>
                </div>
                {/* Distance calculée */}
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--gold)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Distance (km) · calculée
                  </p>
                  <input
                    type="number" value={modalDistance} readOnly placeholder="—"
                    className="game-input"
                    style={{ width: "100%", padding: "8px 10px", background: "rgba(201,162,39,0.08)", border: "1px solid var(--gold)", color: "var(--gold)", fontWeight: 700, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none", cursor: "default" }}
                  />
                </div>
              </div>
            )}

            {/* Feeling */}
            <div>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Ressenti (1-10)
              </p>
              <FeelingStars value={modalFeeling} onChange={setModalFeeling} />
            </div>

            {/* Notes */}
            <div>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Notes
              </p>
              <textarea
                className="game-input"
                rows={2}
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                placeholder="Conditions, sensations..."
                style={{ resize: "none" }}
              />
            </div>
          </div>
        )}
      </GameModal>

      {/* Modale de succès run */}
      {runSuccess && (
        <RunSuccessModal result={runSuccess} onClose={() => setRunSuccess(null)} />
      )}

      {/* Modale de complétion du programme */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(8,7,6,0.92)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
            onClick={() => setShowCompletion(false)}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "var(--surface)",
                border: "2px solid var(--gold)",
                boxShadow: "0 0 60px var(--gold-glow), 0 0 120px var(--gold-glow)",
                padding: "40px 32px",
                textAlign: "center",
                maxWidth: 360,
                width: "100%",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: -1, left: -1, width: 18, height: 18, borderTop: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)" }} />
              <div style={{ position: "absolute", top: -1, right: -1, width: 18, height: 18, borderTop: "3px solid var(--gold)", borderRight: "3px solid var(--gold)" }} />
              <div style={{ position: "absolute", bottom: -1, left: -1, width: 18, height: 18, borderBottom: "3px solid var(--gold)", borderLeft: "3px solid var(--gold)" }} />
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 18, height: 18, borderBottom: "3px solid var(--gold)", borderRight: "3px solid var(--gold)" }} />

              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: 56, marginBottom: 16 }}
              >
                🏆
              </motion.div>

              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--gold)", letterSpacing: "0.2em", marginBottom: 8 }}>
                PROGRAMME TERMINÉ
              </p>
              <h2 style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 24, color: "var(--text)", marginBottom: 16, lineHeight: 1.2 }}>
                Tu es un Conquérant
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                Tu as complété l'intégralité du programme 10km. Honneur à toi, guerrier.
              </p>

              <div style={{
                background: "linear-gradient(135deg, #c9a22720, #f5d76e20)",
                border: "1px solid var(--gold)",
                padding: "16px 24px",
                marginBottom: 28,
              }}>
                <p style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 32, color: "var(--gold)", lineHeight: 1 }}>
                  +1 000
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
                  POINTS DE GLOIRE
                </p>
              </div>

              <button
                onClick={() => setShowCompletion(false)}
                style={{
                  width: "100%", padding: "12px 0",
                  background: "linear-gradient(135deg, #c9a227, #f5d76e)",
                  border: "none", color: "#080706",
                  fontFamily: "'Cinzel', serif", fontWeight: 700,
                  fontSize: 13, letterSpacing: "0.1em", cursor: "pointer",
                }}
              >
                GLOIRE ÉTERNELLE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
