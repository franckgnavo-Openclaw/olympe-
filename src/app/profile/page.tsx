"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { RuneBar } from "@/components/ui/RuneBar";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeTree } from "@/components/BadgeTree";
import { WeeklyKmChart } from "@/components/WeeklyKmChart";
import { getLevel } from "@/lib/points";
import { SESSIONS, TYPE_META } from "@/lib/program";

interface Stats {
  totalKm: number;
  totalRuns: number;
  totalMin: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

interface UserBadge {
  badge: { slug: string; name: string; emoji: string; description: string };
  earnedAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [programSessions, setProgramSessions] = useState<{ day: number; completedAt: string | null }[]>([]);
  const [runs, setRuns] = useState<{ date: string; distanceKm: number }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/stats").then((r) => r.ok ? r.json() : null).then((d) => d && setStats(d));
      fetch("/api/badges").then((r) => r.ok ? r.json() : []).then(setEarnedBadges);
      fetch("/api/program").then((r) => r.ok ? r.json() : []).then((sessions: { day: number; completedAt: string | null; completed: boolean }[]) =>
        setProgramSessions(sessions.filter(s => s.completed).map(s => ({ day: s.day, completedAt: s.completedAt })))
      );
      fetch("/api/runs").then((r) => r.ok ? r.json() : []).then((data: { date: string; distanceKm: number }[]) => setRuns(data));
    }
  }, [status]);

  if (!session) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
    </div>
  );

  const levelInfo = stats ? getLevel(stats.totalPoints) : null;
  const earnedSlugs = new Set(earnedBadges.map((b) => b.badge.slug));
  const xpInLevel = stats && levelInfo ? stats.totalPoints - levelInfo.currentLevelMin : 0;
  const xpNeeded = levelInfo && levelInfo.nextLevelPoints !== Infinity ? levelInfo.nextLevelPoints - levelInfo.currentLevelMin : 1;
  const xpPct = levelInfo && levelInfo.nextLevelPoints !== Infinity
    ? Math.min(100, (xpInLevel / xpNeeded) * 100)
    : 100;

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>

          {/* Profile hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36 }}
          >
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "2px solid var(--gold)",
                boxShadow: "0 0 24px var(--gold-glow)",
                background: "var(--surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: 28,
                color: "var(--gold)",
                overflow: "hidden",
              }}>
                {session.user?.image ? (
                  <img src={session.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  session.user?.name?.[0]?.toUpperCase() ?? "?"
                )}
              </div>
              {/* Level badge */}
              {stats && (
                <div style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  background: "linear-gradient(135deg, #c9a227, #f5d76e)",
                  color: "#080706",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: 10,
                  padding: "2px 6px",
                  lineHeight: 1.4,
                }}>
                  LV{stats.level}
                </div>
              )}
            </div>

            <div>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "var(--text)", marginBottom: 4 }}>
                {session.user?.name}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>{session.user?.email}</p>
              {levelInfo && (
                <span style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  background: "rgba(201,162,39,0.12)",
                  border: "1px solid var(--gold)",
                  color: "var(--gold)",
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.08em",
                }}>
                  {levelInfo.name}
                </span>
              )}
            </div>
          </motion.div>

          {/* XP bar */}
          {stats && levelInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--gold)", letterSpacing: "0.08em" }}>EXPÉRIENCE</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  {stats.totalPoints.toLocaleString()} / {levelInfo.nextLevelPoints === Infinity ? "MAX" : levelInfo.nextLevelPoints.toLocaleString()} XP
                </span>
              </div>
              <RuneBar value={xpPct} color="var(--gold)" height={8} />
            </motion.div>
          )}

          {/* Stats */}
          {stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 32 }}
            >
              {[
                { label: "Runs", value: stats.totalRuns },
                { label: "km", value: stats.totalKm.toFixed(0) },
                { label: "pts", value: stats.totalPoints.toLocaleString() },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    padding: "16px 12px",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
                  <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "var(--gold)", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, letterSpacing: "0.08em" }}>{s.label.toUpperCase()}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Weekly km chart */}
          {runs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ marginBottom: 32 }}
            >
              <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>
                  KM / SEMAINE
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 12px", position: "relative" }}>
                <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
                <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "1px solid var(--gold)", borderRight: "1px solid var(--gold)" }} />
                <WeeklyKmChart runs={runs} weeks={10} />
              </div>
            </motion.div>
          )}

          {/* Badge tree */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: 36 }}
          >
            <BadgeTree earnedBadges={earnedBadges} />
          </motion.div>

          {/* Programme 10km summary */}
          {programSessions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ marginBottom: 36 }}>
              <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--border), transparent)" }} />
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--muted)", letterSpacing: "0.15em" }}>
                  PROGRAMME 10KM
                </span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--border))" }} />
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px 16px", marginBottom: 16, position: "relative" }}>
                <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "var(--gold)" }}>
                  {programSessions.length} / {SESSIONS.filter(s => s.type !== "Repos").length} séances accomplies
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {programSessions.map(ps => {
                  const s = SESSIONS.find(s => s.day === ps.day);
                  if (!s) return null;
                  const meta = TYPE_META[s.type];
                  return (
                    <div key={ps.day} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em" }}>
                            J{s.day} · S{s.week}
                          </span>
                          <span style={{ fontSize: 10, padding: "1px 7px", background: `${meta.color}22`, border: `1px solid ${meta.color}66`, color: meta.color, fontFamily: "'Cinzel', serif" }}>
                            {meta.short}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text)" }}>{s.description}</p>
                        {s.durationMin && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.durationMin} min</p>}
                      </div>
                      {ps.completedAt && (
                        <span style={{ fontSize: 10, color: "var(--muted2)", whiteSpace: "nowrap" }}>
                          {new Date(ps.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Logout */}
          <GlowButton variant="ghost" onClick={() => signOut({ callbackUrl: "/" })} fullWidth>
            Se déconnecter
          </GlowButton>
        </div>
      </main>
    </>
  );
}
