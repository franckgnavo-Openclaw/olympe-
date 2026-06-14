"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const links = [
  { href: "/dashboard", label: "Tableau" },
  { href: "/program", label: "Programme" },
  { href: "/leaderboard", label: "Classement" },
  { href: "/profile", label: "Profil" },
];

export function NavBar() {
  const path = usePathname();
  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      background: "linear-gradient(180deg, #080706f0 0%, #080706a0 100%)",
      backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--border)",
      padding: "0 24px",
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          {/* Rune icon */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#c9a227" strokeWidth="1.5" fill="none"/>
            <path d="M12 6V18M8 9L12 6L16 9M8 15L12 18L16 15" stroke="#c9a227" strokeWidth="1" opacity="0.6"/>
          </svg>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 700,
            fontSize: 18,
            background: "linear-gradient(135deg, #c9a227, #f5d76e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.05em",
          }}>
            OLYMPE
          </span>
        </motion.div>
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 4 }}>
        {links.map((l, i) => {
          const active = path.startsWith(l.href);
          return (
            <motion.div
              key={l.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                href={l.href}
                style={{
                  display: "block",
                  padding: "6px 14px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: active ? "var(--gold)" : "var(--muted)",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid var(--gold)" : "2px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {l.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </header>
  );
}
