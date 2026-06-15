"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      {/* Background runes */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.03, 0.08, 0.03], y: [0, -20, 0] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 1.2 }}
            style={{
              position: "absolute",
              left: `${10 + i * 15}%`,
              top: `${10 + (i % 3) * 30}%`,
              fontFamily: "'Cinzel', serif",
              fontSize: 60 + i * 20,
              color: "var(--gold)",
              userSelect: "none",
            }}
          >
            {["ᚢ", "ᚱ", "ᚠ", "ᚦ", "ᚾ", "ᛁ"][i]}
          </motion.div>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 360, position: "relative" }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <p style={{ fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 28, background: "linear-gradient(135deg, #c9a227, #f5d76e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "0.08em" }}>
              OLYMPE
            </p>
          </Link>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>COURIR COMME UN DIEU</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            padding: "32px 28px",
            position: "relative",
          }}
        >
          {/* Corner ornaments */}
          <div style={{ position: "absolute", top: -1, left: -1, width: 16, height: 16, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 16, height: 16, borderTop: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 16, height: 16, borderBottom: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 16, height: 16, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />

          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, marginBottom: 24, letterSpacing: "0.05em" }}>
            CONNEXION
          </h1>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(139,26,26,0.15)", border: "1px solid rgba(196,30,58,0.4)", color: "#c41e3a", fontSize: 13 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", marginBottom: 8 }}>EMAIL</label>
              <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="toi@email.com" className="game-input" />
            </div>
            <div>
              <label htmlFor="password" style={{ display: "block", fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", marginBottom: 8 }}>MOT DE PASSE</label>
              <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="game-input" />
            </div>
            <div style={{ marginTop: 4 }}>
              <GlowButton type="submit" disabled={loading} fullWidth>
                {loading ? "..." : "Entrer dans l'arène"}
              </GlowButton>
            </div>
          </form>
        </motion.div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>
            Rejoindre le Panthéon
          </Link>
        </p>
      </div>
    </main>
  );
}
