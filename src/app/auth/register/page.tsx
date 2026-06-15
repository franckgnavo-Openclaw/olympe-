"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
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
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>TON ÉPOPÉE COMMENCE ICI</p>
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
          <div style={{ position: "absolute", top: -1, left: -1, width: 16, height: 16, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", top: -1, right: -1, width: 16, height: 16, borderTop: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", bottom: -1, left: -1, width: 16, height: 16, borderBottom: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
          <div style={{ position: "absolute", bottom: -1, right: -1, width: 16, height: 16, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />

          <h1 style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, marginBottom: 24, letterSpacing: "0.05em" }}>
            FORGER MON COMPTE
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

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", marginBottom: 8 }}>NOM DE GUERRIER</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Kratos" className="game-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", marginBottom: 8 }}>EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="toi@email.com" className="game-input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", marginBottom: 8 }}>MOT DE PASSE</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="8 caractères minimum" className="game-input" />
            </div>
            <div style={{ marginTop: 4 }}>
              <GlowButton type="submit" disabled={loading} fullWidth>
                {loading ? "Forge en cours..." : "Rejoindre le Panthéon →"}
              </GlowButton>
            </div>
          </form>
        </motion.div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 24 }}>
          Déjà un compte ?{" "}
          <Link href="/auth/signin" style={{ color: "var(--gold)", fontWeight: 600, textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
