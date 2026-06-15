"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BADGES, PROGRAM_BONUS_MULTIPLIER } from "@/lib/points";
import { SESSIONS, TYPE_META } from "@/lib/program";
import { GameModal } from "@/components/ui/GameModal";

const PROGRAMS = [
  { id: "10km-decouverte", name: "10km — Route Découverte", emoji: "🏃", totalWeeks: 8 },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface RunResult {
  run: { id: string };
  pointsEarned: number;
  isPersonalRecord: boolean;
  newStreak: number;
  newBadges: string[];
}

// ── Animated points counter ───────────────────────────────────────────────────
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

// ── Gold confetti ─────────────────────────────────────────────────────────────
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

// ── Photo picker ─────────────────────────────────────────────────────────────
function PhotoPicker({ label, preview, onChange }: { label: string; preview: string | null; onChange: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
      <button type="button" onClick={() => ref.current?.click()} style={{
        width: "100%", height: 110,
        border: "1px dashed #c9a22750", background: "rgba(201,162,39,0.04)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 6, cursor: "pointer", overflow: "hidden", position: "relative",
        transition: "border-color 0.2s",
      }}>
        {preview
          ? <img src={preview} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <>
              <span style={{ fontSize: 22 }}>📷</span>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>AJOUTER UNE PHOTO</span>
            </>
        }
      </button>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
}

async function uploadPhoto(file: File, runId: string, type: "pre" | "post") {
  const form = new FormData();
  form.append("file", file); form.append("runId", runId); form.append("type", type);
  const res = await fetch("/api/runs/upload-photo", { method: "POST", body: form });
  if (!res.ok) return null;
  return (await res.json()).url ?? null;
}

// ── Styled input ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}
const iStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: "rgba(201,162,39,0.04)", border: "1px solid #3d3020",
  color: "var(--text)", fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none",
};

// ── Main component ────────────────────────────────────────────────────────────
export function AddRunModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"details" | "post-photo" | "success">("details");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [distanceKm, setDistanceKm] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [paceMin, setPaceMin] = useState("");
  const [paceSec, setPaceSec] = useState("");
  const [notes, setNotes] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [isProgramRun, setIsProgramRun] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedSessionDay, setSelectedSessionDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");

  function handlePostPhoto(f: File) { setPostFile(f); setPostPreview(URL.createObjectURL(f)); }

  // Recalcule la distance à partir de l'allure (min:sec/km) et de la durée
  function recomputeDistance(pMin: string, pSec: string, dur: string) {
    const m = parseInt(pMin) || 0;
    const s = parseInt(pSec) || 0;
    const t = parseFloat(dur);
    const paceDec = m + s / 60;
    if (paceDec > 0 && t > 0) {
      setDistanceKm((t / paceDec).toFixed(2));
    } else {
      setDistanceKm("");
    }
  }

  async function handleSubmitRun(e: React.FormEvent) {
    e.preventDefault();
    if (!distanceKm || parseFloat(distanceKm) <= 0) { setError("Renseigne la distance parcourue."); return; }
    if (!durationMin || parseInt(durationMin) <= 0) { setError("Renseigne la durée en minutes."); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/runs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, distanceKm: parseFloat(distanceKm), durationMin: parseInt(durationMin), notes, isProgramRun: isProgramRun && !!selectedProgramId && !!selectedSessionDay }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Erreur"); setLoading(false); return; }
    const data: RunResult = await res.json();
    setResult(data);
    // Mark the program session as done
    if (isProgramRun && selectedProgramId && selectedSessionDay) {
      await fetch("/api/program", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: selectedSessionDay, completed: true }),
      });
    }
    setLoading(false);
    setStep("post-photo");
  }

  async function handleFinish() {
    if (postFile && result) { setLoading(true); await uploadPhoto(postFile, result.run.id, "post"); setLoading(false); }
    setStep("success");
  }

  // ── DETAILS ─────────────────────────────────────────────────────────────────
  if (step === "details") return (
    <GameModal
      title="Détails du Run"
      subtitle="Enregistrer l'épopée"
      icon="⚔️"
      onClose={onClose}
    >
      {error && (
        <div style={{ marginBottom: 12, padding: "9px 12px", background: "rgba(139,26,26,0.2)", border: "1px solid #c41e3a60", color: "#c41e3a", fontSize: 12 }}>
          {error}
        </div>
      )}
      <form id="run-form" onSubmit={handleSubmitRun} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* 1. Date */}
        <Field label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={iStyle} className="game-input" />
        </Field>

        {/* 2. Choix du type de run */}
        <div>
          <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Type de run</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Run libre */}
            <button type="button" onClick={() => { setIsProgramRun(false); setSelectedProgramId(""); setSelectedSessionDay(null); setDurationMin(""); }}
              style={{ padding: "12px 8px", background: !isProgramRun ? "rgba(74,144,217,0.12)" : "var(--surface)", border: `1.5px solid ${!isProgramRun ? "#4a90d9" : "var(--border)"}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s", position: "relative" }}>
              {!isProgramRun && <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1.5px solid #4a90d9", borderLeft: "1.5px solid #4a90d9" }} />}
              <span style={{ fontSize: 22 }}>🏃</span>
              <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, color: !isProgramRun ? "#4a90d9" : "var(--muted)", letterSpacing: "0.04em" }}>RUN LIBRE</p>
              <p style={{ fontSize: 9, color: "var(--muted2)" }}>Course personnelle</p>
            </button>
            {/* Run programme */}
            <button type="button" onClick={() => { setIsProgramRun(true); }}
              style={{ padding: "12px 8px", background: isProgramRun ? "rgba(201,162,39,0.12)" : "var(--surface)", border: `1.5px solid ${isProgramRun ? "var(--gold)" : "var(--border)"}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.15s", position: "relative" }}>
              {isProgramRun && <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1.5px solid var(--gold)", borderLeft: "1.5px solid var(--gold)" }} />}
              <span style={{ fontSize: 22 }}>📋</span>
              <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, color: isProgramRun ? "var(--gold)" : "var(--muted)", letterSpacing: "0.04em" }}>PROGRAMME</p>
              <p style={{ fontSize: 9, color: isProgramRun ? "var(--gold)" : "var(--muted2)" }}>×{PROGRAM_BONUS_MULTIPLIER} XP</p>
            </button>
          </div>
        </div>

        {/* 3. Sélecteurs programme (si programme sélectionné) */}
        <AnimatePresence>
        {isProgramRun && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Sélection du programme */}
            <div style={{ border: "1px solid var(--border2)", background: "var(--surface2)", padding: "10px 12px" }}>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Programme</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PROGRAMS.map(prog => (
                  <button key={prog.id} type="button" onClick={() => { setSelectedProgramId(prog.id); setSelectedSessionDay(null); setDurationMin(""); setDistanceKm(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: selectedProgramId === prog.id ? "rgba(201,162,39,0.12)" : "var(--surface)", border: `1px solid ${selectedProgramId === prog.id ? "var(--gold)" : "var(--border)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.15s", position: "relative" }}>
                    {selectedProgramId === prog.id && <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />}
                    <span style={{ fontSize: 18 }}>{prog.emoji}</span>
                    <div>
                      <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, color: selectedProgramId === prog.id ? "var(--gold)" : "var(--text)", letterSpacing: "0.04em" }}>{prog.name}</p>
                      <p style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{prog.totalWeeks} semaines</p>
                    </div>
                    {selectedProgramId === prog.id && <span style={{ marginLeft: "auto", color: "var(--gold)", fontSize: 14 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection de la séance */}
            {selectedProgramId && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ border: "1px solid var(--border2)", background: "var(--surface2)", padding: "10px 12px" }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Séance</p>
                <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                  {SESSIONS.filter(s => s.type !== "Repos").map(s => {
                    const meta = TYPE_META[s.type];
                    const isSelected = selectedSessionDay === s.day;
                    return (
                      <button key={s.day} type="button" onClick={() => {
                        setSelectedSessionDay(s.day);
                        if (s.durationMin) {
                          setDurationMin(String(s.durationMin));
                          recomputeDistance(paceMin, paceSec, String(s.durationMin));
                        }
                      }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: isSelected ? `${meta.color}15` : "transparent", border: `1px solid ${isSelected ? meta.color : "var(--border)"}`, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--muted2)", width: 24, flexShrink: 0 }}>J{s.day}</span>
                        <span style={{ fontSize: 10, padding: "1px 6px", background: `${meta.color}20`, border: `1px solid ${meta.color}40`, color: meta.color, fontFamily: "'Cinzel', serif", fontWeight: 700, flexShrink: 0 }}>S{s.week}</span>
                        <span style={{ fontSize: 11, color: isSelected ? "var(--text)" : "var(--muted)", flex: 1 }}>{s.description}</span>
                        {s.durationMin && <span style={{ fontSize: 10, color: "var(--muted2)", flexShrink: 0 }}>{s.durationMin}'</span>}
                        {isSelected && <span style={{ color: meta.color, fontSize: 13, flexShrink: 0 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Bannière ×3 si tout sélectionné */}
            {selectedProgramId && selectedSessionDay && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ padding: "8px 12px", background: "rgba(201,162,39,0.08)", border: "1px solid var(--gold)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <p style={{ fontSize: 11, color: "var(--gold)", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>
                  ×{PROGRAM_BONUS_MULTIPLIER} GLOIRE — Séance J{selectedSessionDay} liée
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
        </AnimatePresence>

        {isProgramRun ? (
          <>
            {/* Durée — pré-remplie depuis la séance, éditable */}
            <Field label={`Durée (min)${selectedSessionDay ? " · pré-remplie" : ""}`}>
              <input type="number" min="1" value={durationMin}
                onChange={(e) => { setDurationMin(e.target.value); recomputeDistance(paceMin, paceSec, e.target.value); }}
                placeholder="30" style={{ ...iStyle, borderColor: selectedSessionDay ? "var(--gold)" : "#3d3020" }} className="game-input" />
            </Field>

            {/* Allure — l'utilisateur saisit, la distance se calcule */}
            <Field label="Allure (min/km)">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" min="0" max="59" value={paceMin}
                  onChange={(e) => { setPaceMin(e.target.value); recomputeDistance(e.target.value, paceSec, durationMin); }}
                  placeholder="5" style={{ ...iStyle, textAlign: "center" }} className="game-input" />
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>:</span>
                <input type="number" min="0" max="59" value={paceSec}
                  onChange={(e) => { setPaceSec(e.target.value); recomputeDistance(paceMin, e.target.value, durationMin); }}
                  placeholder="30" style={{ ...iStyle, textAlign: "center" }} className="game-input" />
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>MIN/KM</span>
              </div>
            </Field>

            {/* Distance — calculée automatiquement */}
            <Field label="Distance (km) · calculée">
              <input type="number" value={distanceKm} readOnly placeholder="—"
                style={{ ...iStyle, borderColor: "var(--gold)", background: "rgba(201,162,39,0.08)", color: "var(--gold)", fontWeight: 700, cursor: "default" }} className="game-input" />
            </Field>
          </>
        ) : (
          <>
            {/* 4. Distance */}
            <Field label="Distance (km)">
              <input type="number" step="0.01" min="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} placeholder="5.4" style={iStyle} className="game-input" />
            </Field>

            {/* 5. Durée */}
            <Field label="Durée (min)">
              <input type="number" min="1" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} placeholder="30" style={iStyle} className="game-input" />
            </Field>
          </>
        )}

        {/* Pace indicator — seulement pour run libre */}
        {!isProgramRun && (() => {
          const d = parseFloat(distanceKm);
          const t = parseFloat(durationMin);
          if (!d || !t || d <= 0 || t <= 0) return null;
          const pace = t / d;
          const mins = Math.floor(pace);
          const secs = String(Math.round((pace - mins) * 60)).padStart(2, "0");
          return (
            <motion.div
              key={`${distanceKm}-${durationMin}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(201,162,39,0.06)", border: "1px solid rgba(201,162,39,0.25)" }}
            >
              <span style={{ fontSize: 14 }}>⚡</span>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>
                {mins}:{secs} <span style={{ fontSize: 10, fontWeight: 400, color: "var(--muted)" }}>min/km</span>
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>ALLURE</span>
            </motion.div>
          );
        })()}

        {/* 6. Notes */}
        <Field label="Note (optionnel)">
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Super run du matin…" style={iStyle} className="game-input" />
        </Field>

      </form>
      {/* actions rendered outside form via form= attribute */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #3d3020", color: "#8a7a65", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #c9a22760", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, marginRight: 6, color: "#c9a227" }}>✕</span>
          Annuler
        </button>
        <button form="run-form" type="submit" disabled={loading || (isProgramRun && (!selectedProgramId || !selectedSessionDay))}
          style={{ flex: 1, padding: "9px 0", background: "linear-gradient(135deg, #c9a227, #f5d76e)", border: "none", color: "#080706", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: (loading || (isProgramRun && (!selectedProgramId || !selectedSessionDay))) ? "not-allowed" : "pointer", opacity: (loading || (isProgramRun && (!selectedProgramId || !selectedSessionDay))) ? 0.4 : 1 }}>
          <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid rgba(0,0,0,0.25)", background: "rgba(0,0,0,0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, marginRight: 6 }}>○</span>
          {loading ? "..." : "Valider"}
        </button>
      </div>
    </GameModal>
  );

  // ── POST-PHOTO ───────────────────────────────────────────────────────────────
  if (step === "post-photo" && result) return (
    <GameModal
      title="Run Enregistré !"
      subtitle={`+${result.pointsEarned} pts de gloire${result.isPersonalRecord ? " · Record !" : ""}`}
      icon="⚔️"
      iconGlow="#c9a227"
      description="Photo après la bataille. (optionnel)"
      actions={[
        { label: loading ? "..." : postFile ? "Envoyer" : "Terminer", symbol: "○", onClick: handleFinish, variant: "primary", disabled: loading },
      ]}
    >
      <PhotoPicker label="Photo après" preview={postPreview} onChange={handlePostPhoto} />
    </GameModal>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (step === "success" && result) return (
    <GameModal
      title="Victoire !"
      subtitle="Hauts faits accomplis"
      icon="🏆"
      iconGlow="#c9a227"
      actions={[
        { label: "Retour au Panthéon", symbol: "○", onClick: onSuccess, variant: "primary" },
      ]}
    >
      {/* Confetti */}
      <div style={{ position: "relative" }}><Confetti /></div>

      {/* Points */}
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

      {/* Programme bonus */}
      {isProgramRun && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, type: "spring" }}
          style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 16px", background: "rgba(201,162,39,0.15)", border: "1px solid var(--gold)", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 12, color: "var(--gold)", letterSpacing: "0.06em" }}>
            📋 ×{PROGRAM_BONUS_MULTIPLIER} PROGRAMME 10KM
          </span>
        </motion.div>
      )}

      {/* PR badge */}
      {result.isPersonalRecord && (
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
          style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ display: "inline-block", padding: "4px 14px", background: "linear-gradient(135deg, #c9a227, #f5d76e)", color: "#080706", fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em" }}>
            ⚡ NOUVEAU RECORD PERSONNEL
          </span>
        </motion.div>
      )}

      {/* Streak */}
      {result.newStreak > 1 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ textAlign: "center", fontSize: 12, color: "#c41e3a", fontWeight: 700, marginBottom: 8 }}>
          🔥 {result.newStreak} semaine{result.newStreak > 1 ? "s" : ""} de feu !
        </motion.p>
      )}

      {/* New badges */}
      {result.newBadges.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <p style={{ textAlign: "center", fontSize: 9, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Haut Fait Débloqué !
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
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 10px", border: "1px solid var(--gold)", background: "rgba(201,162,39,0.08)", minWidth: 64, position: "relative" }}
                >
                  <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
                  <motion.span style={{ fontSize: 24 }} animate={{ rotate: [0, -10, 10, 0] }} transition={{ delay: 1 + i * 0.12, duration: 0.4 }}>
                    {badge.emoji}
                  </motion.span>
                  <span style={{ fontSize: 9, fontFamily: "'Cinzel', serif", color: "var(--gold)", textAlign: "center", lineHeight: 1.3 }}>
                    {badge.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Post-run photo */}
      {postPreview && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <div style={{ textAlign: "center" }}>
            <img src={postPreview} alt="Après" style={{ width: 80, height: 80, objectFit: "cover", border: "1px solid var(--gold)", boxShadow: "0 0 12px var(--gold-glow)" }} />
            <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 3, fontFamily: "'Cinzel', serif" }}>APRÈS COMBAT</p>
          </div>
        </motion.div>
      )}
    </GameModal>
  );

  return null;
}
