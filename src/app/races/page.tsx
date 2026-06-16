"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/NavBar";
import { Spinner } from "@/components/ui/Spinner";

interface Race {
  id: string;
  name: string;
  date: string;
  city: string;
  department: string | null;
  distanceKm: number;
  raceType: string | null;
  registrationUrl: string | null;
  registrationEnd: string | null;
  organizer: string | null;
  description: string | null;
  elevation: number | null;
}

type CalView = "year" | "month" | "week" | "day";

const FR_MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const FR_DAYS_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

function distanceLabel(km: number): string {
  if (km === 5) return "5 km";
  if (km === 10) return "10 km";
  if (km >= 21 && km <= 21.2) return "Semi";
  if (km >= 42 && km <= 42.3) return "Marathon";
  if (km >= 50) return "Ultra";
  return `${km} km`;
}

function distanceColor(km: number): string {
  if (km <= 5) return "#7ab648";
  if (km <= 10) return "#c9a227";
  if (km <= 21.2) return "#d4732a";
  if (km <= 42.3) return "#c44b1a";
  return "#c41e3a";
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function RaceCard({ race, compact = false }: { race: Race; compact?: boolean }) {
  const date = new Date(race.date);
  const color = distanceColor(race.distanceKm);
  const regEnd = race.registrationEnd ? new Date(race.registrationEnd) : null;
  const daysToReg = regEnd ? Math.ceil((regEnd.getTime() - Date.now()) / 86400000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${color}`,
        padding: compact ? "10px 14px" : "14px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -1, right: -1, width: 8, height: 8, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: compact ? 0 : 8 }}>
        <div style={{ flexShrink: 0, textAlign: "center", minWidth: 36 }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 18, color, lineHeight: 1 }}>
            {date.getDate()}
          </p>
          <p style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.06em", fontFamily: "'Cinzel', serif" }}>
            {FR_MONTHS[date.getMonth()].slice(0, 3).toUpperCase()}
          </p>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: compact ? 12 : 14, color: "var(--text)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {race.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              📍 {race.city}{race.department ? ` (${race.department})` : ""}
            </span>
            <span style={{
              fontSize: 9, padding: "1px 7px",
              background: `${color}20`, border: `1px solid ${color}55`,
              color, fontFamily: "'Cinzel', serif", fontWeight: 700,
            }}>
              {distanceLabel(race.distanceKm)}
            </span>
          </div>

          {!compact && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {race.elevation != null && (
                <span style={{ fontSize: 10, color: "var(--muted)" }}>⛰ {race.elevation}m D+</span>
              )}
              {race.organizer && (
                <span style={{ fontSize: 10, color: "var(--muted2)", fontStyle: "italic" }}>{race.organizer}</span>
              )}
              {daysToReg !== null && daysToReg > 0 && (
                <span style={{ fontSize: 10, color: daysToReg < 7 ? "#c41e3a" : "var(--muted)", fontFamily: "'Cinzel', serif" }}>
                  🗓 Inscriptions : {daysToReg}j restants
                </span>
              )}
              {daysToReg !== null && daysToReg <= 0 && (
                <span style={{ fontSize: 10, color: "#c41e3a", fontFamily: "'Cinzel', serif" }}>
                  Inscriptions fermées
                </span>
              )}
              {race.registrationUrl && (
                <a
                  href={race.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    fontSize: 10, padding: "3px 10px",
                    background: "rgba(201,162,39,0.12)",
                    border: "1px solid var(--gold)",
                    color: "var(--gold)",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700,
                    textDecoration: "none",
                    letterSpacing: "0.06em",
                  }}
                >
                  S'INSCRIRE →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Views ─────────────────────────────────────────────────────────────────────

function YearView({ races, year, onDayClick }: { races: Race[]; year: number; onDayClick: (d: Date) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
      {Array.from({ length: 12 }, (_, m) => {
        const firstDay = new Date(year, m, 1);
        const startPad = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const monthRaces = races.filter(r => {
          const d = new Date(r.date);
          return d.getFullYear() === year && d.getMonth() === m;
        });

        return (
          <div key={m} style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px" }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 8, textAlign: "center" }}>
              {FR_MONTHS[m].toUpperCase()}
              {monthRaces.length > 0 && (
                <span style={{ marginLeft: 6, fontSize: 9, background: "var(--gold)", color: "#080706", padding: "1px 5px", borderRadius: 8 }}>
                  {monthRaces.length}
                </span>
              )}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {FR_DAYS_SHORT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 8, color: "var(--muted2)", fontFamily: "'Cinzel', serif", paddingBottom: 2 }}>{d[0]}</div>
              ))}
              {Array.from({ length: startPad }, (_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const date = new Date(year, m, day);
                const hasRace = monthRaces.some(r => isSameDay(new Date(r.date), date));
                return (
                  <div
                    key={day}
                    onClick={() => hasRace && onDayClick(date)}
                    style={{
                      textAlign: "center", fontSize: 9, lineHeight: "20px",
                      background: hasRace ? "var(--gold)" : "transparent",
                      color: hasRace ? "#080706" : "var(--muted2)",
                      borderRadius: 2,
                      cursor: hasRace ? "pointer" : "default",
                      fontWeight: hasRace ? 700 : 400,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ races, year, month, onDayClick }: { races: Race[]; year: number; month: number; onDayClick: (d: Date) => void }) {
  const firstDay = new Date(year, month, 1);
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {FR_DAYS_SHORT.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array.from({ length: startPad }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dayRaces = races.filter(r => isSameDay(new Date(r.date), date));
          const isToday = isSameDay(date, today);

          return (
            <div
              key={day}
              onClick={() => dayRaces.length > 0 && onDayClick(date)}
              style={{
                minHeight: 64,
                background: isToday ? "rgba(201,162,39,0.08)" : "var(--surface)",
                border: `1px solid ${isToday ? "var(--gold)" : "var(--border)"}`,
                padding: "4px 6px",
                cursor: dayRaces.length > 0 ? "pointer" : "default",
              }}
            >
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: isToday ? "var(--gold)" : "var(--muted2)", marginBottom: 3 }}>{day}</p>
              {dayRaces.slice(0, 2).map(r => {
                const color = distanceColor(r.distanceKm);
                return (
                  <div key={r.id} style={{ fontSize: 9, color, background: `${color}15`, padding: "1px 4px", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderLeft: `2px solid ${color}` }}>
                    {distanceLabel(r.distanceKm)} · {r.city}
                  </div>
                );
              })}
              {dayRaces.length > 2 && (
                <div style={{ fontSize: 8, color: "var(--muted)", fontFamily: "'Cinzel', serif" }}>+{dayRaces.length - 2}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ races, weekStart, onDayClick }: { races: Race[]; weekStart: Date; onDayClick: (d: Date) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const today = new Date();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {days.map((day, i) => {
        const dayRaces = races.filter(r => isSameDay(new Date(r.date), day));
        const isToday = isSameDay(day, today);
        return (
          <div key={i}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <p style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif" }}>{FR_DAYS_SHORT[i]}</p>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: isToday ? "var(--gold)" : "transparent",
                border: isToday ? "none" : "1px solid var(--border2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "4px auto 0",
                fontFamily: "'Cinzel', serif", fontWeight: 700,
                fontSize: 13, color: isToday ? "#080706" : "var(--text)",
              }}>
                {day.getDate()}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dayRaces.map(r => {
                const color = distanceColor(r.distanceKm);
                return (
                  <div
                    key={r.id}
                    onClick={() => onDayClick(day)}
                    style={{
                      background: `${color}15`, border: `1px solid ${color}40`,
                      borderLeft: `3px solid ${color}`,
                      padding: "6px 7px", cursor: "pointer",
                    }}
                  >
                    <p style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'Cinzel', serif" }}>{distanceLabel(r.distanceKm)}</p>
                    <p style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.city}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ races, date }: { races: Race[]; date: Date }) {
  const dayRaces = races.filter(r => isSameDay(new Date(r.date), date));
  return (
    <div>
      <p style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "var(--muted)", marginBottom: 16, letterSpacing: "0.08em" }}>
        {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
      </p>
      {dayRaces.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 12 }}>
          Aucune course ce jour
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dayRaces.map(r => <RaceCard key={r.id} race={r} />)}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<CalView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [distRange, setDistRange] = useState<[number, number]>([0, 100]);
  const [cityFilter, setCityFilter] = useState("");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/races?limit=500`)
      .then(r => r.ok ? r.json() : [])
      .then(setRaces)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return races.filter(r => {
      if (r.distanceKm < distRange[0] || r.distanceKm > distRange[1]) return false;
      if (cityFilter && !r.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      return true;
    });
  }, [races, distRange, cityFilter]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weekStart = getMonday(cursor);

  function navigate(dir: 1 | -1) {
    setSelectedDay(null);
    setCursor(prev => {
      const d = new Date(prev);
      if (view === "year") d.setFullYear(d.getFullYear() + dir);
      else if (view === "month") d.setMonth(d.getMonth() + dir);
      else if (view === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  }

  function handleDayClick(d: Date) {
    setSelectedDay(d);
    setCursor(d);
    setView("day");
  }

  function navLabel() {
    if (view === "year") return String(year);
    if (view === "month") return `${FR_MONTHS[month]} ${year}`;
    if (view === "week") {
      const end = new Date(weekStart);
      end.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()} – ${end.getDate()} ${FR_MONTHS[end.getMonth()]} ${year}`;
    }
    return cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <>
      <NavBar />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px" }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: "var(--muted)", letterSpacing: "0.2em", marginBottom: 6 }}>
              FRANCE · COURSES À PIED
            </p>
            <h1 style={{
              fontFamily: "'Cinzel Decorative', serif", fontWeight: 700, fontSize: 24,
              background: "linear-gradient(135deg, #c9a227, #f5d76e)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: 4,
            }}>
              CALENDRIER
            </h1>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              {filtered.length} course{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* Filters */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 20px", marginBottom: 20, position: "relative" }}>
            <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: "2px solid var(--gold)", borderLeft: "2px solid var(--gold)" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: "2px solid var(--gold)", borderRight: "2px solid var(--gold)" }} />

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
              {/* Distance slider */}
              <div style={{ flex: 2, minWidth: 200 }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 10 }}>
                  DISTANCE · {distRange[0] === 0 ? "toute" : `${distRange[0]} km`} → {distRange[1] >= 100 ? "illimitée" : `${distRange[1]} km`}
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", minWidth: 28 }}>Min</span>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={distRange[0]}
                    onChange={e => setDistRange([+e.target.value, Math.max(+e.target.value, distRange[1])])}
                    style={{ flex: 1, accentColor: "var(--gold)" }}
                  />
                  <input
                    type="range" min={0} max={100} step={5}
                    value={distRange[1]}
                    onChange={e => setDistRange([Math.min(distRange[0], +e.target.value), +e.target.value])}
                    style={{ flex: 1, accentColor: "var(--gold)" }}
                  />
                  <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", minWidth: 28 }}>Max</span>
                </div>
                {/* Distance chips */}
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "5 km", range: [0, 5] as [number, number] },
                    { label: "10 km", range: [8, 12] as [number, number] },
                    { label: "Semi", range: [20, 22] as [number, number] },
                    { label: "Marathon", range: [40, 45] as [number, number] },
                    { label: "Ultra", range: [50, 100] as [number, number] },
                    { label: "Tout", range: [0, 100] as [number, number] },
                  ].map(({ label, range }) => {
                    const active = distRange[0] === range[0] && distRange[1] === range[1];
                    return (
                      <button
                        key={label}
                        onClick={() => setDistRange(range)}
                        style={{
                          padding: "3px 10px", fontSize: 9,
                          background: active ? "var(--gold)" : "var(--surface2)",
                          border: `1px solid ${active ? "var(--gold)" : "var(--border)"}`,
                          color: active ? "#080706" : "var(--muted)",
                          fontFamily: "'Cinzel', serif", fontWeight: 700,
                          cursor: "pointer", letterSpacing: "0.06em",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* City filter */}
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: "var(--muted)", letterSpacing: "0.12em", marginBottom: 10 }}>VILLE</p>
                <input
                  type="text"
                  value={cityFilter}
                  onChange={e => setCityFilter(e.target.value)}
                  placeholder="Paris, Lyon..."
                  className="game-input"
                  style={{ width: "100%", padding: "7px 10px", fontSize: 12 }}
                />
              </div>
            </div>
          </div>

          {/* Calendar nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            {/* View tabs */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["year", "month", "week", "day"] as CalView[]).map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setSelectedDay(null); }}
                  style={{
                    padding: "5px 12px",
                    background: view === v ? "var(--gold)" : "var(--surface)",
                    border: `1px solid ${view === v ? "var(--gold)" : "var(--border)"}`,
                    color: view === v ? "#080706" : "var(--muted)",
                    fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  {v === "year" ? "Année" : v === "month" ? "Mois" : v === "week" ? "Semaine" : "Jour"}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => navigate(-1)}
                style={{ width: 32, height: 32, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--gold)", fontSize: 16, cursor: "pointer" }}
              >‹</button>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "var(--text)", minWidth: 160, textAlign: "center" }}>
                {navLabel()}
              </span>
              <button
                onClick={() => navigate(1)}
                style={{ width: 32, height: 32, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--gold)", fontSize: 16, cursor: "pointer" }}
              >›</button>
              <button
                onClick={() => { setCursor(new Date()); setSelectedDay(null); }}
                style={{ padding: "5px 12px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", fontFamily: "'Cinzel', serif", fontSize: 9, cursor: "pointer", letterSpacing: "0.08em" }}
              >
                AUJOURD&apos;HUI
              </button>
            </div>
          </div>

          {/* Calendar body */}
          {loading ? (
            <Spinner fullPage label="INVOCATION" />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${view}-${cursor.toISOString().slice(0, 10)}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                {view === "year" && (
                  <YearView races={filtered} year={year} onDayClick={handleDayClick} />
                )}
                {view === "month" && (
                  <MonthView races={filtered} year={year} month={month} onDayClick={handleDayClick} />
                )}
                {view === "week" && (
                  <WeekView races={filtered} weekStart={weekStart} onDayClick={handleDayClick} />
                )}
                {view === "day" && (
                  <DayView races={filtered} date={selectedDay ?? cursor} />
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Legend */}
          {!loading && (
            <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.08em" }}>DISTANCES :</span>
              {[
                { label: "≤ 5 km", color: "#7ab648" },
                { label: "10 km", color: "#c9a227" },
                { label: "Semi", color: "#d4732a" },
                { label: "Marathon", color: "#c44b1a" },
                { label: "Ultra", color: "#c41e3a" },
              ].map(({ label, color }) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--muted)" }}>
                  <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: "inline-block" }} />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🏁</p>
              <p style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>Aucune course trouvée</p>
              <p style={{ fontSize: 12, color: "var(--muted2)" }}>Modifie les filtres ou lance le scraper depuis l&apos;admin.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
