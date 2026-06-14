"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { getLevel } from "@/lib/points";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  image?: string;
  totalPoints: number;
  level: string;
  levelNum: number;
  streak: number;
  runsCount: number;
  totalKm: number;
}

const PODIUM_COLORS = ["#c0c0c0", "#c9a227", "#cd7f32"];
const PODIUM_LABELS = ["ARGENT", "OR", "BRONZE"];

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => { setEntries(d); setLoading(false); });
  }, []);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", marginBottom: 40 }}
          >
            <p style={{ color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              Valhalla des Coureurs
            </p>
            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(135deg, #c9a227, #f5d76e)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.05em",
            }}>
              CLASSEMENT
            </h1>
            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, var(--gold))" }} />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" fill="#c9a227" fillOpacity="0.6"/>
              </svg>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--gold), transparent)" }} />
            </div>
          </motion.div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{ width: 32, height: 32, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%", margin: "0 auto 12px" }}
              />
              <span style={{ color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: "0.1em" }}>INVOCATION...</span>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚔️</div>
              <p style={{ fontFamily: "'Cinzel', serif", color: "var(--muted)", letterSpacing: "0.08em" }}>Aucun guerrier enregistré</p>
            </div>
          ) : (
            <>
              {/* Podium */}
              {top3.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 32, alignItems: "end" }}>
                  {[top3[1], top3[0], top3[2]].map((entry, i) => {
                    if (!entry) return <div key={i} />;
                    const isCenter = i === 1;
                    const color = PODIUM_COLORS[isCenter ? 1 : i === 0 ? 0 : 2];
                    const heights = [100, 140, 80];
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: isCenter ? 0.2 : 0.4, duration: 0.6 }}
                        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                      >
                        {isCenter && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            style={{ fontSize: 24 }}
                          >
                            👑
                          </motion.div>
                        )}
                        {/* Avatar */}
                        <div style={{
                          width: isCenter ? 56 : 44,
                          height: isCenter ? 56 : 44,
                          borderRadius: "50%",
                          border: `2px solid ${color}`,
                          boxShadow: `0 0 16px ${color}60`,
                          background: "var(--surface2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "'Cinzel', serif",
                          fontWeight: 700,
                          fontSize: isCenter ? 22 : 17,
                          color,
                        }}>
                          {entry.name[0]?.toUpperCase()}
                        </div>
                        <p style={{ fontSize: 11, color: "var(--text)", textAlign: "center", fontFamily: "'Cinzel', serif", fontWeight: isCenter ? 700 : 400 }}>
                          {entry.name.split(" ")[0]}
                        </p>
                        {/* Podium block */}
                        <div style={{
                          width: "100%",
                          height: heights[i],
                          background: `linear-gradient(180deg, ${color}18, ${color}08)`,
                          border: `1px solid ${color}60`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 2,
                        }}>
                          <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: isCenter ? 18 : 15, color }}>
                            {entry.totalPoints.toLocaleString()}
                          </p>
                          <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em" }}>GLOIRE</p>
                          <p style={{ fontSize: 9, color: color, letterSpacing: "0.08em", marginTop: 4 }}>{PODIUM_LABELS[isCenter ? 1 : i === 0 ? 0 : 2]}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[...top3, ...rest].map((entry, i) => {
                  const isMe = session?.user?.id === entry.id;
                  const isTop3 = entry.rank <= 3;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => isMe ? router.push("/profile") : router.push(`/profile/${entry.id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: "12px 16px",
                        background: isMe ? "rgba(201,162,39,0.06)" : "var(--surface)",
                        border: `1px solid ${isMe ? "var(--gold)" : "var(--border)"}`,
                        position: "relative",
                        transition: "border-color 0.2s, background 0.2s",
                        cursor: "pointer",
                      }}
                      whileHover={{ borderColor: "var(--border2)", background: "var(--surface2)" }}
                    >
                      {isMe && <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />}

                      {/* Rank */}
                      <span style={{
                        width: 28,
                        textAlign: "center",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 700,
                        fontSize: 13,
                        color: isTop3 ? PODIUM_COLORS[entry.rank - 1] : "var(--muted2)",
                      }}>
                        {entry.rank}
                      </span>

                      {/* Avatar */}
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px solid ${isTop3 ? PODIUM_COLORS[entry.rank - 1] : "var(--border2)"}`,
                        background: "var(--surface2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 700,
                        fontSize: 13,
                        color: isTop3 ? PODIUM_COLORS[entry.rank - 1] : "var(--muted)",
                        flexShrink: 0,
                      }}>
                        {entry.name[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>
                          {entry.name}
                          {isMe && <span style={{ color: "var(--gold)", marginLeft: 6, fontSize: 11 }}>(toi)</span>}
                        </p>
                        <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>
                          {entry.level} · {entry.totalKm.toFixed(1)} km · {entry.runsCount} runs
                        </p>
                      </div>

                      {/* Points */}
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 15, color: isTop3 ? PODIUM_COLORS[entry.rank - 1] : "var(--gold)" }}>
                          {entry.totalPoints.toLocaleString()}
                        </p>
                        <p style={{ color: "var(--muted)", fontSize: 10 }}>pts</p>
                      </div>

                      {/* Streak */}
                      {entry.streak > 0 && (
                        <div style={{ fontSize: 12, color: "#c41e3a", fontWeight: 700 }}>
                          🔥{entry.streak}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
