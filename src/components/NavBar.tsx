"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/dashboard", label: "Tableau",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: "/program", label: "Programme",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
      </svg>
    ),
  },
  {
    href: "/leaderboard", label: "Classement",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
  },
  {
    href: "/profile", label: "Profil",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

export function NavBar() {
  const path = usePathname();
  return (
    <>
      {/* Top bar — logo only */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "linear-gradient(180deg, #080706f0 0%, #080706a0 100%)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#c9a227" strokeWidth="1.5" fill="none"/>
            <path d="M12 6V18M8 9L12 6L16 9M8 15L12 18L16 15" stroke="#c9a227" strokeWidth="1" opacity="0.6"/>
          </svg>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontWeight: 700,
            fontSize: 17,
            background: "linear-gradient(135deg, #c9a227, #f5d76e)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.05em",
          }}>
            OLYMPE
          </span>
        </Link>
      </header>

      {/* Bottom tab bar */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#080706f5",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {links.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: active ? "var(--gold)" : "var(--muted)",
                transition: "color 0.2s",
              }}
            >
              {l.icon}
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 9,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 400,
              }}>
                {l.label}
              </span>
              {active && (
                <span style={{
                  position: "absolute",
                  bottom: 0,
                  width: 32,
                  height: 2,
                  background: "var(--gold)",
                  borderRadius: 2,
                }} />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
