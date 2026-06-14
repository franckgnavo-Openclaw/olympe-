"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { RuneBar } from "@/components/ui/RuneBar";
import { BadgeTree } from "@/components/BadgeTree";
import { SESSIONS, TYPE_META } from "@/lib/program";

interface PublicProfile {
  id: string;
  name: string;
  image?: string;
  totalPoints: number;
  level: number;
  levelName: string;
  nextLevelPoints: number | null;
  currentLevelMin: number;
  currentStreak: number;
  longestStreak: number;
  totalKm: number;
  totalMin: number;
  totalRuns: number;
  joinedAt: string;
  badges: { earnedAt: string; badge: { slug: string; name: string; emoji: string; description: string } }[];
  programSessions: { day: number; completedAt: string | null }[];
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 12px", textAlign: "center", position: "relative" }}>
      <div style={{ position: "absolute", top: -1, left: -1, width: 8, height: 8, borderTop: "1px solid var(--gold)", borderLeft: "1px solid var(--gold)" }} />
      <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "var(--gold)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: "var(--muted2)", marginTop: 2 }}>{sub}</p>}
      <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, letterSpacing: "0.08em" }}>{label.toUpperCase()}</p>
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = params.id as string;

  useEffect(() => {
    if (session?.user?.id === userId) {
      router.replace("/profile");
      return;
    }
    fetch(`/api/users/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setProfile)
      .catch(() => router.push("/leaderboard"))
      .finally(() => setLoading(false));
  }, [userId, session, router]);

  if (loading || !profile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
      </div>
    );
  }

  const xpInLevel = profile.currentLevelMin != null ? profile.totalPoints - profile.currentLevelMin : profile.totalPoints;
  const xpNeeded = profile.nextLevelPoints ? profile.nextLevelPoints - (profile.currentLevelMin ?? 0) : 1;
  const xpPct = profile.nextLevelPoints
    ? Math.min(100, (xpInLevel / xpNeeded) * 100)
    : 100;

  const joinYear = new Date(profile.joinedAt).getFullYear();

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>

          {/* Back */}
          <Link href="/leaderboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 11, fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", textDecoration: "none", marginBottom: 24 }}>
            ← CLASSEMENT
          </Link>

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                border: "2px solid var(--gold)", boxShadow: "0 0 24px var(--gold-glow)",
                background: "var(--surface2)", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: 28, color: "var(--gold)", overflow: "hidden",
              }}>
                {profile.image
                  ? <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : profile.name[0]?.toUpperCase()}
              </div>
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                background: "linear-gradient(135deg, #c9a227, #f5d76e)",
                color: "#080706", fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: 10, padding: "2px 6px", lineHeight: 1.4,
              }}>
                LV{profile.level}
              </div>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22, color: "var(--text)", marginBottom: 6 }}>
                {profile.name}
              </h1>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(201,162,39,0.12)", border: "1px solid var(--gold)", color: "var(--gold)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>
                  {profile.levelName}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>Guerrier depuis {joinYear}</span>
              </div>
            </div>
          </motion.div>

          {/* XP bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            style={{ marginBottom: 24, padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", position: "relative" }}>
            <div style={{ position: "absolute", top: -1, left: -1, width: 12, height: 12, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--gold)", letterSpacing: "0.08em" }}>EXPÉRIENCE</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {profile.totalPoints.toLocaleString()} / {profile.nextLevelPoints ? profile.nextLevelPoints.toLocaleString() : "MAX"} XP
              </span>
            </div>
            <RuneBar value={xpPct} color="var(--gold)" height={8} />
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 32 }}>
            <StatBox label="Runs" value={profile.totalRuns} />
            <StatBox label="km" value={profile.totalKm.toFixed(0)} />
            <StatBox label="Gloire" value={profile.totalPoints.toLocaleString()} />
            <StatBox label="Série" value={`🔥${profile.currentStreak}`} sub={`record ${profile.longestStreak}`} />
          </motion.div>

          {/* Badge tree */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <BadgeTree earnedBadges={profile.badges} />
          </motion.div>

          {/* Programme 10km summary */}
          {profile.programSessions && profile.programSessions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              style={{ marginTop: 32 }}>
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
                  {profile.programSessions.length} / {SESSIONS.filter(s => s.type !== "Repos").length} séances accomplies
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {profile.programSessions.map(ps => {
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

        </div>
      </main>
    </>
  );
}
