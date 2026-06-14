"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AddRunModal } from "@/components/AddRunModal";
import { NavBar } from "@/components/NavBar";
import { RuneBar } from "@/components/ui/RuneBar";
import { StatCard } from "@/components/ui/StatCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { getLevel } from "@/lib/points";

interface Run {
  id: string;
  date: string;
  createdAt: string;
  distanceKm: number;
  durationMin: number;
  notes?: string;
  pointsEarned: number;
  isPersonalRecord: boolean;
  isProgramRun: boolean;
  photoPreUrl?: string | null;
  photoPostUrl?: string | null;
}

interface Stats {
  totalKm: number;
  totalRuns: number;
  totalMin: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  lastRunDate: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showAddRun, setShowAddRun] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRuns();
      fetchStats();
    }
  }, [status]);

  async function fetchRuns() {
    const res = await fetch("/api/runs");
    if (res.ok) setRuns(await res.json());
  }

  async function fetchStats() {
    const res = await fetch("/api/stats");
    if (res.ok) setStats(await res.json());
  }

  function onRunAdded() {
    fetchRuns();
    fetchStats();
    setShowAddRun(false);
  }

  if (status === "loading" || !session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%" }}
        />
        <span style={{ color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: "0.1em" }}>CHARGEMENT</span>
      </div>
    );
  }

  const levelInfo = stats ? getLevel(stats.totalPoints) : null;
  const xpInLevel = stats && levelInfo ? stats.totalPoints - levelInfo.currentLevelMin : 0;
  const xpNeeded = levelInfo && levelInfo.nextLevelPoints !== Infinity ? levelInfo.nextLevelPoints - levelInfo.currentLevelMin : 1;
  const xpPct = levelInfo && levelInfo.nextLevelPoints !== Infinity
    ? Math.min(100, (xpInLevel / xpNeeded) * 100)
    : 100;

  // Streak at risk: has streak but last run is from a previous week
  const getWeekStart = (d: Date) => {
    const day = d.getDay();
    const ms = d.getTime() - (day === 0 ? 6 : day - 1) * 86400000;
    return new Date(ms).setHours(0, 0, 0, 0);
  };
  const streakAtRisk = !!(
    stats && stats.currentStreak > 0 && stats.lastRunDate &&
    getWeekStart(new Date(stats.lastRunDate)) < getWeekStart(new Date())
  );

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>

          {/* Hero greeting */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: 32, textAlign: "center" }}
          >
            <p style={{ color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              Bienvenue, Guerrier
            </p>
            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 32,
              fontWeight: 700,
              background: "linear-gradient(135deg, #c9a227, #f5d76e, #c9a227)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
              marginBottom: 4,
            }}>
              {session.user?.name?.split(" ")[0]?.toUpperCase() ?? "RUNNER"}
            </h1>
            {levelInfo && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Niveau {stats?.level} · <span style={{ color: "var(--gold-l)" }}>{levelInfo.name}</span>
              </p>
            )}
          </motion.div>

          {/* Streak banner */}
          <AnimatePresence>
            {stats && stats.currentStreak > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  marginBottom: streakAtRisk ? 8 : 24,
                  padding: "20px 24px",
                  background: "linear-gradient(135deg, #8b1a1a20, #c41e3a15)",
                  border: "1px solid #c41e3a60",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: "2px solid #c41e3a", borderLeft: "2px solid #c41e3a" }} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: "2px solid #c41e3a", borderRight: "2px solid #c41e3a" }} />

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ fontSize: 36, lineHeight: 1 }}
                >
                  🔥
                </motion.div>
                <div>
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "#c41e3a", lineHeight: 1 }}>
                    {stats.currentStreak} SEMAINE{stats.currentStreak > 1 ? "S" : ""}
                  </p>
                  <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                    Série active · Record : {stats.longestStreak} sem.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streak danger alert */}
          <AnimatePresence>
            {streakAtRisk && (
              <motion.div
                key="streak-risk"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  marginBottom: 24,
                  padding: "12px 16px",
                  background: "rgba(180,100,0,0.12)",
                  border: "1px solid rgba(220,140,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ fontSize: 20, flexShrink: 0 }}
                >⚠️</motion.span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: "#e09020", letterSpacing: "0.06em", marginBottom: 2 }}>
                    SÉRIE EN DANGER
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted)" }}>
                    Tu n&apos;as pas encore couru cette semaine. Lance-toi avant dimanche soir !
                  </p>
                </div>
                <button
                  onClick={() => setShowAddRun(true)}
                  style={{ flexShrink: 0, padding: "6px 12px", background: "rgba(220,140,0,0.2)", border: "1px solid rgba(220,140,0,0.6)", color: "#e09020", fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  COURIR
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Level bar */}
          {stats && levelInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                marginBottom: 28,
                padding: "16px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "var(--gold)" }}>{levelInfo.name}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  {levelInfo.nextLevelPoints === Infinity
                    ? `${stats.totalPoints.toLocaleString()} XP · MAX`
                    : `${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`}
                </span>
              </div>
              <RuneBar value={xpPct} color="var(--gold)" height={8} />
              {levelInfo.nextLevelName && (
                <p style={{ textAlign: "right", fontSize: 10, color: "var(--muted)", marginTop: 6, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", opacity: 0.7 }}>
                  → {levelInfo.nextLevelName}
                </p>
              )}
            </motion.div>
          )}

          {/* Stats grid */}
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              <StatCard label="Distance" value={stats.totalKm.toFixed(1)} unit="kilomètres" color="var(--gold)" delay={0.1} />
              <StatCard label="Runs" value={stats.totalRuns} unit="sorties" color="var(--gold-l)" delay={0.15} />
              <StatCard label="Points" value={stats.totalPoints.toLocaleString()} unit="pts de gloire" color="var(--gold)" delay={0.2} />
              <StatCard label="Temps" value={Math.round(stats.totalMin / 60)} unit="heures au combat" color="var(--gold-l)" delay={0.25} />
            </div>
          )}

          {/* Add run CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: 40 }}
          >
            <GlowButton onClick={() => setShowAddRun(true)} fullWidth>
              ⚔️ Enregistrer un Run
            </GlowButton>
          </motion.div>

          {/* Recent runs */}
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Dernières Batailles
            </span>
            <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
          </div>

          {runs.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* Hero onboarding */}
              <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.1 }}
                  style={{ fontSize: 52, marginBottom: 14, filter: "drop-shadow(0 0 20px #c9a22740)" }}
                >
                  ⚔️
                </motion.div>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: "var(--foreground)", marginBottom: 8, letterSpacing: "0.06em" }}>
                  Ton épopée commence ici
                </p>
                <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 280, margin: "0 auto 28px", lineHeight: 1.6 }}>
                  Suis le Programme 10km pour progresser pas à pas, ou enregistre un run libre pour marquer ta première victoire.
                </p>
              </div>

              {/* Two paths */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {/* Programme — primary */}
                <Link href="/program" style={{ textDecoration: "none" }}>
                  <motion.div
                    whileHover={{ borderColor: "var(--gold)", boxShadow: "0 0 20px var(--gold-glow)" }}
                    style={{
                      background: "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.04))",
                      border: "1px solid rgba(201,162,39,0.5)",
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      cursor: "pointer",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
                    <div style={{ fontSize: 32, flexShrink: 0 }}>📋</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 4, letterSpacing: "0.06em" }}>
                        Programme 10km
                      </p>
                      <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                        8 semaines · 56 séances guidées · Progression structurée du débutant au 10km
                      </p>
                    </div>
                    <div style={{ fontSize: 18, color: "var(--gold)", flexShrink: 0, opacity: 0.7 }}>›</div>
                  </motion.div>
                </Link>

                {/* Run libre — secondary */}
                <motion.div
                  whileHover={{ borderColor: "var(--border-hover, #444)", boxShadow: "0 0 12px rgba(255,255,255,0.04)" }}
                  onClick={() => setShowAddRun(true)}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "18px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                >
                  <div style={{ fontSize: 32, flexShrink: 0 }}>🏃</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 4, letterSpacing: "0.06em" }}>
                      Run libre
                    </p>
                    <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                      Enregistre ta sortie d&apos;aujourd&apos;hui · Gagne des points et des hauts faits
                    </p>
                  </div>
                  <div style={{ fontSize: 18, color: "var(--muted)", flexShrink: 0 }}>›</div>
                </motion.div>
              </div>

              {/* Hint */}
              <p style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", opacity: 0.6 }}>
                ✦ CHAQUE FOULÉE CONSTRUIT LA LÉGENDE ✦
              </p>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(showAllRuns ? runs : runs.slice(0, 3)).map((run, i) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={`/runs/${run.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <motion.div
                      whileHover={{ borderColor: "var(--gold-l)", boxShadow: "0 0 16px var(--gold-glow)" }}
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        position: "relative",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {/* Photos */}
                      {(run.photoPreUrl || run.photoPostUrl) && (
                        <div style={{ display: "flex", gap: 1 }}>
                          {run.photoPreUrl && (
                            <div style={{ position: "relative", flex: 1 }}>
                              <img src={run.photoPreUrl} alt="Avant" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                              <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", padding: "2px 6px", fontFamily: "'Cinzel', serif" }}>AVANT</span>
                            </div>
                          )}
                          {run.photoPostUrl && (
                            <div style={{ position: "relative", flex: 1 }}>
                              <img src={run.photoPostUrl} alt="Après" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                              <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", padding: "2px 6px", fontFamily: "'Cinzel', serif" }}>APRÈS</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                        {/* Corner ornament */}
                        <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "1px solid var(--border2)", borderLeft: "1px solid var(--border2)" }} />

                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "var(--text)", fontSize: 16 }}>
                              {run.distanceKm.toFixed(2)} km
                            </span>
                            {run.isPersonalRecord && (
                              <span style={{
                                fontSize: 10,
                                padding: "2px 8px",
                                background: "linear-gradient(135deg, #c9a227, #f5d76e)",
                                color: "#080706",
                                fontFamily: "'Cinzel', serif",
                                fontWeight: 700,
                                letterSpacing: "0.05em",
                              }}>
                                ⚡ RECORD
                              </span>
                            )}
                          </div>
                          <p style={{ color: "var(--muted)", fontSize: 12 }}>
                            {run.durationMin} min · {new Date(run.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {new Date(run.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {run.notes && (
                            <p style={{ color: "var(--muted2)", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>"{run.notes}"</p>
                          )}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "var(--gold)", fontSize: 18 }}>
                            +{run.pointsEarned}
                          </p>
                          <p style={{ color: "var(--muted)", fontSize: 10 }}>GLOIRE</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
              {runs.length > 3 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setShowAllRuns(v => !v)}
                  style={{
                    width: "100%", padding: "10px 0",
                    background: "transparent", border: "1px solid var(--border)",
                    color: "var(--muted)", fontFamily: "'Cinzel', serif",
                    fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
                    cursor: "pointer", marginTop: 4,
                  }}
                >
                  {showAllRuns ? "▲ Réduire" : `▼ Voir Plus (${runs.length - 3} autres)`}
                </motion.button>
              )}
            </div>
          )}
        </div>
      </main>

      {showAddRun && <AddRunModal onClose={() => setShowAddRun(false)} onSuccess={onRunAdded} />}
    </>
  );
}
