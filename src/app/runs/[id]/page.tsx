"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GameModal } from "@/components/ui/GameModal";
import { BADGES } from "@/lib/points";

interface Run {
  id: string;
  date: string;
  distanceKm: number;
  durationMin: number;
  notes?: string | null;
  pointsEarned: number;
  isPersonalRecord: boolean;
  photoPreUrl?: string | null;
  photoPostUrl?: string | null;
  createdAt: string;
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 10px", textAlign: "center", position: "relative" }}
    >
      <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
      <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "var(--gold)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "var(--muted2)", marginTop: 3 }}>{sub}</p>}
    </motion.div>
  );
}

export default function RunDetailPage() {
  const { status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ distanceKm: "", durationMin: "", date: "", notes: "" });
  const [saveResult, setSaveResult] = useState<{ newBadges: string[]; revokedBadges: string[] } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/runs/${params.id}`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setRun)
        .catch(() => router.push("/dashboard"))
        .finally(() => setLoading(false));
    }
  }, [status, params.id, router]);

  function openEdit() {
    if (!run) return;
    const d = new Date(run.date);
    const pad = (n: number) => String(n).padStart(2, "0");
    setEditForm({
      distanceKm: String(run.distanceKm),
      durationMin: String(run.durationMin),
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      notes: run.notes ?? "",
    });
    setShowEditModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/runs/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const data = await res.json();
      setRun(data);
      setShowEditModal(false);
      if (data.newBadges?.length > 0 || data.revokedBadges?.length > 0) {
        setSaveResult({ newBadges: data.newBadges ?? [], revokedBadges: data.revokedBadges ?? [] });
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/runs/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
    else { setDeleting(false); setShowDeleteModal(false); }
  }

  if (loading || !run) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
      </div>
    );
  }

  const pace = run.durationMin / run.distanceKm;
  const paceMin = Math.floor(pace);
  const paceSec = Math.round((pace - paceMin) * 60);
  const date = new Date(run.date);

  return (
    <>
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", gap: 16, padding: "0 16px", height: 60,
          borderBottom: "1px solid var(--border)", background: "rgba(8,7,6,0.9)", backdropFilter: "blur(12px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <Link href="/dashboard" style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border2)", textDecoration: "none", color: "var(--muted)", fontSize: 16 }}>
            ←
          </Link>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 15, flex: 1, letterSpacing: "0.06em" }}>RAPPORT DE COMBAT</h1>
          {run.isPersonalRecord && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{ fontSize: 10, padding: "3px 10px", background: "linear-gradient(135deg, #c9a227, #f5d76e)", color: "#080706", fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: "0.05em" }}>
              ⚡ RECORD
            </motion.span>
          )}
        </header>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Date + points */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 19, color: "var(--text)", textTransform: "capitalize" }}>
                {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{date.toLocaleDateString("fr-FR", { year: "numeric" })}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 28, color: "var(--gold)", lineHeight: 1, textShadow: "0 0 20px #c9a22760" }}>
                +{run.pointsEarned}
              </p>
              <p style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.1em" }}>GLOIRE</p>
            </div>
          </motion.div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <StatBox label="Distance" value={run.distanceKm.toFixed(2)} sub="km" />
            <StatBox label="Durée" value={run.durationMin} sub="minutes" />
            <StatBox label="Allure" value={`${paceMin}:${paceSec.toString().padStart(2, "0")}`} sub="min/km" />
          </div>

          {/* Photos */}
          {(run.photoPreUrl || run.photoPostUrl) && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.15em" }}>PHOTOS</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {run.photoPreUrl
                  ? <div style={{ position: "relative" }}>
                      <img src={run.photoPreUrl} alt="Avant" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                      <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9, color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", fontFamily: "'Cinzel', serif" }}>AVANT</span>
                    </div>
                  : <div style={{ aspectRatio: "1", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted2)", fontSize: 20 }}>—</div>
                }
                {run.photoPostUrl
                  ? <div style={{ position: "relative" }}>
                      <img src={run.photoPostUrl} alt="Après" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                      <span style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9, color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", fontFamily: "'Cinzel', serif" }}>APRÈS</span>
                    </div>
                  : <div style={{ aspectRatio: "1", border: "1px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted2)", fontSize: 20 }}>—</div>
                }
              </div>
            </div>
          )}

          {/* Notes */}
          {run.notes && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 18px", position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
              <p style={{ fontSize: 10, fontFamily: "'Cinzel', serif", color: "var(--muted)", letterSpacing: "0.1em", marginBottom: 6 }}>NOTES</p>
              <p style={{ fontSize: 13, color: "var(--text)", fontStyle: "italic", lineHeight: 1.6 }}>"{run.notes}"</p>
            </motion.div>
          )}

          <p style={{ fontSize: 11, color: "var(--muted2)", textAlign: "center" }}>
            Enregistré le {new Date(run.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={openEdit}
              style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid var(--border2)", color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
            >
              ✎ Modifier
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ flex: 1, padding: "11px 0", background: "transparent", border: "1px solid #3d3020", color: "var(--muted2)", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Supprimer
            </button>
          </div>
        </div>
      </main>

      {/* Edit modal */}
      <GameModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifier le Run"
        subtitle="Correction des données"
        icon="✎"
        iconGlow="#c9a227"
        actions={[
          { label: "Annuler", symbol: "✕", onClick: () => setShowEditModal(false), variant: "secondary" },
          { label: saving ? "..." : "Sauvegarder", symbol: "○", onClick: handleSave, variant: "primary", disabled: saving },
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Date</label>
            <input type="date" className="game-input" value={editForm.date}
              onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
              style={{ colorScheme: "dark" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Distance (km)</label>
              <input type="number" step="0.01" className="game-input" value={editForm.distanceKm}
                onChange={e => setEditForm(f => ({ ...f, distanceKm: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Durée (min)</label>
              <input type="number" className="game-input" value={editForm.durationMin}
                onChange={e => setEditForm(f => ({ ...f, durationMin: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Notes</label>
            <textarea className="game-input" rows={2} value={editForm.notes}
              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              style={{ resize: "none" }} />
          </div>
        </div>
      </GameModal>

      {/* Badge changes after save */}
      {saveResult && (
        <GameModal
          title="Run mis à jour"
          subtitle="Recalcul des hauts faits"
          icon="✎"
          iconGlow="#c9a227"
          actions={[{ label: "OK", symbol: "○", onClick: () => setSaveResult(null), variant: "primary" }]}
        >
          {saveResult.newBadges.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontFamily: "'Cinzel', serif", color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                ✦ Hauts faits débloqués
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {saveResult.newBadges.map(slug => {
                  const b = BADGES.find(b => b.slug === slug);
                  return b ? (
                    <div key={slug} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid var(--gold)", background: "rgba(201,162,39,0.08)", fontSize: 11 }}>
                      <span>{b.emoji}</span>
                      <span style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", fontSize: 10 }}>{b.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {saveResult.revokedBadges.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontFamily: "'Cinzel', serif", color: "#c41e3a", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                ✦ Hauts faits révoqués
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {saveResult.revokedBadges.map(slug => {
                  const b = BADGES.find(b => b.slug === slug);
                  return b ? (
                    <div key={slug} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", border: "1px solid #c41e3a40", background: "rgba(196,30,58,0.06)", fontSize: 11, opacity: 0.8 }}>
                      <span style={{ filter: "grayscale(1)" }}>{b.emoji}</span>
                      <span style={{ fontFamily: "'Cinzel', serif", color: "#c41e3a", fontSize: 10 }}>{b.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
          {saveResult.newBadges.length === 0 && saveResult.revokedBadges.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>Aucun changement de haut fait.</p>
          )}
        </GameModal>
      )}

      {/* Delete confirmation modal */}
      <GameModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Supprimer ?"
        subtitle="Action irréversible"
        icon="⚠️"
        iconGlow="#c41e3a"
        description="Ce run et ses points seront définitivement effacés de l'histoire."
        actions={[
          { label: "Annuler", symbol: "✕", onClick: () => setShowDeleteModal(false), variant: "secondary" },
          { label: deleting ? "..." : "Confirmer", symbol: "○", onClick: handleDelete, variant: "danger", disabled: deleting },
        ]}
      />
    </>
  );
}
