import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <span className="text-2xl font-black tracking-tight">
          <span style={{ color: "var(--orange)" }}>OLY</span>MPE
        </span>
        <div className="flex gap-3">
          <Link
            href="/auth/signin"
            className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:opacity-80 transition"
          >
            Connexion
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 text-sm font-bold rounded-full gradient-orange text-white transition hover:opacity-90"
          >
            Commencer
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--orange)] text-[var(--orange)] text-xs font-semibold mb-8 uppercase tracking-widest">
          🏆 Compétition • Badges • Classements
        </div>
        <h1 className="text-5xl sm:text-7xl font-black leading-none mb-6">
          Chaque run
          <br />
          <span style={{ color: "var(--orange)" }}>mérite</span> une
          <br />
          victoire.
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mb-10">
          Transforme tes sorties running en compétition sociale. Gagne des points, monte dans le classement, débloque des badges.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/auth/register"
            className="px-8 py-4 text-base font-bold rounded-full gradient-orange text-white hover:opacity-90 transition"
          >
            Créer mon compte gratuit →
          </Link>
          <Link
            href="/leaderboard"
            className="px-8 py-4 text-base font-medium rounded-full border border-[var(--border)] hover:border-[var(--muted)] transition"
          >
            Voir le classement
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--border)] border-t border-[var(--border)]">
        {[
          { emoji: "🔥", title: "Streaks", desc: "Maintiens ta série de runs quotidiens et explose ton score" },
          { emoji: "🏆", title: "Leaderboard", desc: "Compare-toi à tes amis et à la communauté en temps réel" },
          { emoji: "⚡", title: "Badges", desc: "Débloque des achievements à chaque étape de ta progression" },
        ].map((f) => (
          <div key={f.title} className="bg-[var(--surface)] px-8 py-10">
            <div className="text-4xl mb-4">{f.emoji}</div>
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-[var(--muted)] text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Level system */}
      <section className="px-6 py-16 text-center border-t border-[var(--border)]">
        <h2 className="text-2xl font-black mb-8">Progresse de niveau en niveau</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {["🟤 Rookie", "🔵 Runner", "🟠 Challenger", "🔴 Elite", "⭐ Legend"].map((l) => (
            <span
              key={l}
              className="px-4 py-2 rounded-full border border-[var(--border)] text-sm font-semibold bg-[var(--surface-2)]"
            >
              {l}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-[var(--muted)]">
        © 2025 Olympe — Fait avec ❤️ pour les coureurs
      </footer>
    </main>
  );
}
