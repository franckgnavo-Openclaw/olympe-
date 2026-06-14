export type SessionType = "Endurance" | "Intervalles" | "Renforcement" | "Croisé" | "Récupération" | "Repos" | "Compétition";

export interface ProgramSession {
  day: number;
  week: number;
  type: SessionType;
  description: string;
  durationMin: number | null;
}

export const PROGRAM_ID = "10km-decouverte";

export const SESSIONS: ProgramSession[] = [
  { day: 1,  week: 1, type: "Endurance",    description: "2×5' @ Z1",              durationMin: 10 },
  { day: 2,  week: 1, type: "Repos",         description: "—",                      durationMin: null },
  { day: 3,  week: 1, type: "Renforcement",  description: "Exercices 1-4",          durationMin: 9 },
  { day: 4,  week: 1, type: "Endurance",    description: "2×8' @ Z1",              durationMin: 16 },
  { day: 5,  week: 1, type: "Repos",         description: "—",                      durationMin: null },
  { day: 6,  week: 1, type: "Endurance",    description: "2×10' @ Z1",             durationMin: 20 },
  { day: 7,  week: 1, type: "Croisé",       description: "30' @ Z1",               durationMin: 30 },
  { day: 8,  week: 2, type: "Repos",         description: "—",                      durationMin: null },
  { day: 9,  week: 2, type: "Endurance",    description: "2×12' @ Z1",             durationMin: 24 },
  { day: 10, week: 2, type: "Renforcement",  description: "Exercices 1-4",          durationMin: 9 },
  { day: 11, week: 2, type: "Endurance",    description: "2×15' @ Z1",             durationMin: 30 },
  { day: 12, week: 2, type: "Croisé",       description: "30' @ Z1",               durationMin: 30 },
  { day: 13, week: 2, type: "Repos",         description: "—",                      durationMin: null },
  { day: 14, week: 2, type: "Endurance",    description: "20' @ Z1",               durationMin: 20 },
  { day: 15, week: 3, type: "Renforcement",  description: "Exercices 1-6",          durationMin: 21 },
  { day: 16, week: 3, type: "Intervalles",   description: "5×1' @ Z2",             durationMin: 30 },
  { day: 17, week: 3, type: "Repos",         description: "—",                      durationMin: null },
  { day: 18, week: 3, type: "Croisé",       description: "30' @ Z1",               durationMin: 30 },
  { day: 19, week: 3, type: "Endurance",    description: "25' @ Z1",               durationMin: 25 },
  { day: 20, week: 3, type: "Repos",         description: "—",                      durationMin: null },
  { day: 21, week: 3, type: "Endurance",    description: "30' @ Z1",               durationMin: 30 },
  { day: 22, week: 4, type: "Renforcement",  description: "Exercices 1-6",          durationMin: 21 },
  { day: 23, week: 4, type: "Repos",         description: "—",                      durationMin: null },
  { day: 24, week: 4, type: "Endurance",    description: "35' @ Z1",               durationMin: 35 },
  { day: 25, week: 4, type: "Croisé",       description: "45' @ Z1",               durationMin: 45 },
  { day: 26, week: 4, type: "Repos",         description: "—",                      durationMin: null },
  { day: 27, week: 4, type: "Intervalles",   description: "5×2' @ Z2",             durationMin: 35 },
  { day: 28, week: 4, type: "Récupération",  description: "20' @ Z1",               durationMin: 20 },
  { day: 29, week: 5, type: "Repos",         description: "—",                      durationMin: null },
  { day: 30, week: 5, type: "Endurance",    description: "35' @ Z1",               durationMin: 35 },
  { day: 31, week: 5, type: "Croisé",       description: "45' @ Z1",               durationMin: 45 },
  { day: 32, week: 5, type: "Repos",         description: "—",                      durationMin: null },
  { day: 33, week: 5, type: "Intervalles",   description: "5×3' @ Z2",             durationMin: 40 },
  { day: 34, week: 5, type: "Renforcement",  description: "Exercices 1-6",          durationMin: 21 },
  { day: 35, week: 5, type: "Repos",         description: "—",                      durationMin: null },
  { day: 36, week: 6, type: "Endurance",    description: "40' @ Z1",               durationMin: 40 },
  { day: 37, week: 6, type: "Croisé",       description: "45' @ Z1",               durationMin: 45 },
  { day: 38, week: 6, type: "Repos",         description: "—",                      durationMin: null },
  { day: 39, week: 6, type: "Intervalles",   description: "4×1' Z3 + 4×2' Z2",    durationMin: 44 },
  { day: 40, week: 6, type: "Endurance",    description: "40' @ Z1",               durationMin: 40 },
  { day: 41, week: 6, type: "Repos",         description: "—",                      durationMin: null },
  { day: 42, week: 6, type: "Renforcement",  description: "Exercices 1-8",          durationMin: 23 },
  { day: 43, week: 7, type: "Endurance",    description: "45' @ Z1",               durationMin: 45 },
  { day: 44, week: 7, type: "Repos",         description: "—",                      durationMin: null },
  { day: 45, week: 7, type: "Intervalles",   description: "6×1' Z3 + 5×2' Z2",    durationMin: 48 },
  { day: 46, week: 7, type: "Croisé",       description: "45' @ Z1",               durationMin: 45 },
  { day: 47, week: 7, type: "Repos",         description: "—",                      durationMin: null },
  { day: 48, week: 7, type: "Endurance",    description: "50' @ Z1",               durationMin: 50 },
  { day: 49, week: 7, type: "Renforcement",  description: "Exercices 1-8",          durationMin: 23 },
  { day: 50, week: 8, type: "Repos",         description: "—",                      durationMin: null },
  { day: 51, week: 8, type: "Endurance",    description: "25' @ Z1",               durationMin: 25 },
  { day: 52, week: 8, type: "Intervalles",   description: "10×30'' @ Z3",          durationMin: 25 },
  { day: 53, week: 8, type: "Repos",         description: "—",                      durationMin: null },
  { day: 54, week: 8, type: "Récupération",  description: "20' @ Z1",               durationMin: 20 },
  { day: 55, week: 8, type: "Repos",         description: "—",                      durationMin: null },
  { day: 56, week: 8, type: "Compétition",   description: "10 km — COURSE !",       durationMin: null },
];

export const TYPE_META: Record<SessionType, { emoji: string; color: string; short: string }> = {
  Endurance:    { emoji: "🏃", color: "#4a90d9", short: "END" },
  Intervalles:  { emoji: "⚡", color: "#c9a227", short: "INT" },
  Renforcement: { emoji: "💪", color: "#8b5e3c", short: "REN" },
  Croisé:      { emoji: "🚴", color: "#5a8a5a", short: "CRO" },
  Récupération: { emoji: "🌊", color: "#6a7a8a", short: "REC" },
  Repos:        { emoji: "😴", color: "#3d3020", short: "REP" },
  Compétition:  { emoji: "🏆", color: "#c9a227", short: "10K" },
};

export const WEEK_DURATIONS: Record<number, string> = {
  1: "1h25", 2: "1h53", 3: "2h16", 4: "2h36",
  5: "2h21", 6: "3h12", 7: "3h31", 8: "1h10",
};
