"use client";

export function FeelingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          style={{
            width: 22, height: 22, borderRadius: "50%", border: "none", cursor: "pointer",
            background: n <= value ? "var(--gold)" : "var(--surface3)",
            fontSize: 10, color: n <= value ? "#080706" : "var(--muted2)",
            fontFamily: "'Cinzel', serif", fontWeight: 700,
            transition: "background 0.15s",
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
