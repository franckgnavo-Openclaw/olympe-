export const PROGRAM_BONUS_MULTIPLIER = 3;
export const PROGRAM_COMPLETION_BONUS = 1000;

export function calculateRunPoints(distanceKm: number, isPersonalRecord: boolean, streakWeeks: number, isProgramRun = false): number {
  let points = 10;
  points += Math.floor(distanceKm) * 2;
  if (isPersonalRecord) points += 25;
  if (streakWeeks > 0 && streakWeeks % 4 === 0) points += 50;
  if (isProgramRun) points *= PROGRAM_BONUS_MULTIPLIER;
  return Math.round(points);
}

const LEVELS = [
  { level: 1, name: "Recrue",      min: 0,     next: 150 },
  { level: 2, name: "Coureur",     min: 150,   next: 400 },
  { level: 3, name: "Challenger",  min: 400,   next: 900 },
  { level: 4, name: "Vétéran",     min: 900,   next: 2000 },
  { level: 5, name: "Élite",       min: 2000,  next: 5000 },
  { level: 6, name: "Héros",       min: 5000,  next: 10000 },
  { level: 7, name: "Légende",     min: 10000, next: Infinity },
];

export function getLevel(totalPoints: number): { level: number; name: string; nextLevelPoints: number; currentLevelMin: number; nextLevelName: string | null } {
  const current = [...LEVELS].reverse().find((l) => totalPoints >= l.min) ?? LEVELS[0];
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  return { level: current.level, name: current.name, nextLevelPoints: current.next, currentLevelMin: current.min, nextLevelName: next?.name ?? null };
}

// ── BADGE DEFINITIONS ──────────────────────────────────────────────────────────
// used in UI (BadgeTree, AddRunModal, Profile)
export const BADGES = [
  // ── Distance cumulée ──
  { slug: "first-run",    name: "Premier Pas",    emoji: "👣", description: "Compléter son 1er run",           branch: "distance" },
  { slug: "5km-total",    name: "Marcheur",       emoji: "🚶", description: "5 km cumulés",                   branch: "distance" },
  { slug: "10km",         name: "Coureur",        emoji: "🏃", description: "10 km cumulés",                  branch: "distance" },
  { slug: "100km",        name: "Centurion",      emoji: "⚔️", description: "100 km cumulés",                 branch: "distance" },
  { slug: "500km-total",  name: "Marathonien",    emoji: "🛡️", description: "500 km cumulés",                branch: "distance" },
  // ── Performance / vitesse ──
  { slug: "personal-record", name: "Sang de Guerrier", emoji: "🩸", description: "Battre son record de distance", branch: "performance" },
  { slug: "10km-single",  name: "Décathlonien",   emoji: "⚡", description: "10 km en une seule sortie",      branch: "performance" },
  { slug: "sub-6-pace",   name: "Foudre",         emoji: "💨", description: "Allure < 6 min/km",              branch: "performance" },
  { slug: "half-marathon",name: "Demi-Dieu",      emoji: "🌗", description: "21 km en une seule sortie",      branch: "performance" },
  { slug: "marathon",     name: "Olympien",       emoji: "🌕", description: "42 km en une seule sortie",      branch: "performance" },
  // ── Régularité / séries ──
  { slug: "streak-2",     name: "Étincelle",      emoji: "✨", description: "2 semaines consécutives actives", branch: "regularite" },
  { slug: "streak-4",     name: "Flamme",         emoji: "🔥", description: "4 semaines consécutives",        branch: "regularite" },
  { slug: "streak-7",     name: "Brasier",        emoji: "🌋", description: "7 semaines consécutives",        branch: "regularite" },
  { slug: "week-3runs",   name: "Discipliné",     emoji: "📅", description: "3 runs en une semaine",          branch: "regularite" },
  { slug: "week-5runs",   name: "Forgeron",       emoji: "🔨", description: "5 runs en une semaine",          branch: "regularite" },
  // ── Moments ──
  { slug: "early-bird",   name: "Aube du Guerrier", emoji: "🌅", description: "Enregistrer un run avant 8h", branch: "moments" },
  { slug: "night-runner", name: "Ombre Nocturne", emoji: "🌙", description: "Enregistrer un run après 21h",  branch: "moments" },
  // ── Points / Prestige ──
  { slug: "100-points",   name: "Aspirant",       emoji: "🥉", description: "100 pts de gloire",             branch: "prestige" },
  { slug: "500-points",   name: "Vaillant",       emoji: "🥈", description: "500 pts de gloire",             branch: "prestige" },
  { slug: "1000-points",  name: "Valeureux",      emoji: "🥇", description: "1 000 pts de gloire",           branch: "prestige" },
  { slug: "5000-points",  name: "Héros",          emoji: "👑", description: "5 000 pts de gloire",           branch: "prestige" },
  { slug: "level-5",      name: "Ascension",      emoji: "⭐", description: "Atteindre le niveau 5",         branch: "prestige" },
  // ── Programme 10km ──
  { slug: "program-first",    name: "Engagé",         emoji: "📋", description: "Valider sa 1ère séance du programme 10km",     branch: "programme" },
  { slug: "program-week1",    name: "Cap de la 1ère", emoji: "🗓️", description: "Terminer la semaine 1 du programme",          branch: "programme" },
  { slug: "program-10",       name: "Régiment",       emoji: "⚔️", description: "10 séances du programme accomplies",          branch: "programme" },
  { slug: "program-halfway",  name: "Mi-Chemin",      emoji: "🌓", description: "28 séances du programme accomplies",          branch: "programme" },
  { slug: "program-complete", name: "Conquérant",     emoji: "🏆", description: "Programme 10km terminé en intégralité !",     branch: "programme" },
  // ── Distance cumulée (nouveaux) ──
  { slug: "25km-total",       name: "Éclaireur",             emoji: "🔭", description: "25 km cumulés",                branch: "distance" },
  { slug: "50km-total",       name: "Demi-Centurion",        emoji: "🗡️", description: "50 km cumulés",                branch: "distance" },
  { slug: "250km-total",      name: "Légionnaire",           emoji: "🛡️", description: "250 km cumulés",               branch: "distance" },
  { slug: "1000km-total",     name: "Légende des Terres",    emoji: "🌍", description: "1 000 km cumulés",             branch: "distance" },
  // ── Distance sortie unique (nouveaux) ──
  { slug: "5km-single",       name: "Première Lame",         emoji: "🗡️", description: "5 km en une seule sortie",    branch: "performance" },
  { slug: "15km-single",      name: "Éclaireur Lointain",    emoji: "🏹", description: "15 km en une seule sortie",   branch: "performance" },
  { slug: "30km-single",      name: "Endurant",              emoji: "💪", description: "30 km en une seule sortie",   branch: "performance" },
  { slug: "ultra",            name: "Ultra-Guerrier",        emoji: "🌩️", description: "50 km en une seule sortie",   branch: "performance" },
  // ── Vitesse & Durée (nouveaux) ──
  { slug: "sub-5-pace",       name: "Tempête",               emoji: "🌪️", description: "Allure < 5 min/km",           branch: "performance" },
  { slug: "sub-4-pace",       name: "Foudre Divine",         emoji: "⚡", description: "Allure < 4 min/km",           branch: "performance" },
  { slug: "1h-run",           name: "Longue Marche",         emoji: "⏳", description: "Run ≥ 60 minutes",             branch: "performance" },
  { slug: "2h-run",           name: "Épopée",                emoji: "🏔️", description: "Run ≥ 120 minutes",            branch: "performance" },
  // ── Régularité (nouveaux) ──
  { slug: "10-runs",          name: "Habitué",               emoji: "📌", description: "10 runs au total",             branch: "regularite" },
  { slug: "50-runs",          name: "Vétéran du Bitume",     emoji: "🎖️", description: "50 runs au total",             branch: "regularite" },
  { slug: "100-runs",         name: "Centurion des Foulées", emoji: "🏅", description: "100 runs au total",            branch: "regularite" },
  { slug: "streak-12",        name: "Inébranlable",          emoji: "🏛️", description: "12 semaines consécutives",     branch: "regularite" },
  { slug: "month-10runs",     name: "Mois de Fer",           emoji: "🔩", description: "10 runs en un seul mois",      branch: "regularite" },
  // ── Moments (nouveaux) ──
  { slug: "noon-runner",      name: "Soleil de Midi",        emoji: "☀️", description: "Run entre 12h et 14h",         branch: "moments" },
  { slug: "comeback",         name: "Le Revenant",           emoji: "👻", description: "Runner après 30 jours d'absence", branch: "moments" },
  // ── Prestige (nouveau) ──
  { slug: "10000-points",     name: "Transcendé",            emoji: "👁️", description: "10 000 pts de gloire",         branch: "prestige" },
];
