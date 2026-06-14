import { prisma } from "./prisma";
import { PROGRAM_ID, SESSIONS } from "./program";

interface RunContext {
  userId: string;
  isPersonalRecord: boolean;
  newStreak: number;
  totalKm: number;
  totalRuns: number;
  runsThisWeek: number;
  runsThisMonth: number;
  distanceKm: number;
  durationMin: number;
  pace: number;            // min/km de ce run
  newTotalPoints: number;
  level: number;
  runHour: number;         // heure locale serveur (0-23) au moment du POST
  daysSinceLastRun: number | null;
}

export async function checkAndAwardBadges(ctx: RunContext): Promise<string[]> {
  const {
    userId, isPersonalRecord, newStreak, totalKm, totalRuns,
    runsThisWeek, runsThisMonth, distanceKm, durationMin, pace,
    newTotalPoints, level, runHour, daysSinceLastRun,
  } = ctx;

  const [allBadges, earnedBadges] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badge: { select: { slug: true } } } }),
  ]);

  const earnedSlugs = new Set(earnedBadges.map((b) => b.badge.slug));
  const should = (slug: string, cond: boolean) => cond && !earnedSlugs.has(slug);

  const toAward = allBadges.filter((b) => {
    switch (b.slug) {
      // Distance cumulée
      case "first-run":       return should(b.slug, totalRuns === 1);
      case "5km-total":       return should(b.slug, totalKm >= 5);
      case "10km":            return should(b.slug, totalKm >= 10);
      case "100km":           return should(b.slug, totalKm >= 100);
      case "500km-total":     return should(b.slug, totalKm >= 500);
      // Performance
      case "personal-record": return should(b.slug, isPersonalRecord);
      case "10km-single":     return should(b.slug, distanceKm >= 10);
      case "sub-6-pace":      return should(b.slug, pace > 0 && pace < 6);
      case "half-marathon":   return should(b.slug, distanceKm >= 21.1);
      case "marathon":        return should(b.slug, distanceKm >= 42.195);
      // Régularité
      case "streak-2":        return should(b.slug, newStreak >= 2);
      case "streak-4":        return should(b.slug, newStreak >= 4);
      case "streak-7":        return should(b.slug, newStreak >= 7);
      case "week-3runs":      return should(b.slug, runsThisWeek >= 3);
      case "week-5runs":      return should(b.slug, runsThisWeek >= 5);
      case "month-20runs":    return should(b.slug, runsThisMonth >= 20);
      // Moments
      case "early-bird":      return should(b.slug, runHour < 8);
      case "night-runner":    return should(b.slug, runHour >= 21);
      // Points / Prestige
      case "100-points":      return should(b.slug, newTotalPoints >= 100);
      case "500-points":      return should(b.slug, newTotalPoints >= 500);
      case "1000-points":     return should(b.slug, newTotalPoints >= 1000);
      case "5000-points":     return should(b.slug, newTotalPoints >= 5000);
      case "level-5":         return should(b.slug, level >= 5);
      // Distance cumulée (nouveaux)
      case "25km-total":      return should(b.slug, totalKm >= 25);
      case "50km-total":      return should(b.slug, totalKm >= 50);
      case "250km-total":     return should(b.slug, totalKm >= 250);
      case "1000km-total":    return should(b.slug, totalKm >= 1000);
      // Distance sortie unique (nouveaux)
      case "5km-single":      return should(b.slug, distanceKm >= 5);
      case "15km-single":     return should(b.slug, distanceKm >= 15);
      case "30km-single":     return should(b.slug, distanceKm >= 30);
      case "ultra":           return should(b.slug, distanceKm >= 50);
      // Vitesse & Durée (nouveaux)
      case "sub-5-pace":      return should(b.slug, pace > 0 && pace < 5);
      case "sub-4-pace":      return should(b.slug, pace > 0 && pace < 4);
      case "1h-run":          return should(b.slug, durationMin >= 60);
      case "2h-run":          return should(b.slug, durationMin >= 120);
      // Régularité (nouveaux)
      case "10-runs":         return should(b.slug, totalRuns >= 10);
      case "50-runs":         return should(b.slug, totalRuns >= 50);
      case "100-runs":        return should(b.slug, totalRuns >= 100);
      case "streak-12":       return should(b.slug, newStreak >= 12);
      case "month-10runs":    return should(b.slug, runsThisMonth >= 10);
      // Moments (nouveaux)
      case "noon-runner":     return should(b.slug, runHour >= 12 && runHour < 14);
      case "comeback":        return should(b.slug, daysSinceLastRun !== null && daysSinceLastRun >= 30);
      // Prestige (nouveau)
      case "10000-points":    return should(b.slug, newTotalPoints >= 10000);
      default:                return false;
    }
  });

  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  return toAward.map((b) => b.slug);
}

// Révoque les badges dont les conditions ne sont plus remplies après suppression d'un run
export async function checkAndRevokeBadges(userId: string, newTotalPoints: number, newLevel: number): Promise<string[]> {
  const [earnedBadges, allRuns, programRunCount] = await Promise.all([
    prisma.userBadge.findMany({ where: { userId }, include: { badge: true } }),
    prisma.run.findMany({ where: { userId } }),
    prisma.userProgramSession.count({ where: { userId, completed: true, runId: { not: null } } }),
  ]);
  if (earnedBadges.length === 0) return [];

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalRuns = allRuns.length;
  const totalKm = allRuns.reduce((s, r) => s + r.distanceKm, 0);
  const maxSingleKm = allRuns.reduce((m, r) => Math.max(m, r.distanceKm), 0);
  const minPace = allRuns.reduce((m, r) => {
    if (r.distanceKm > 0) return Math.min(m, r.durationMin / r.distanceKm);
    return m;
  }, Infinity);
  const hasPersonalRecord = allRuns.some(r => r.isPersonalRecord);
  const maxSingleDuration = allRuns.reduce((m, r) => Math.max(m, r.durationMin), 0);

  const getWeekStart = (d: Date) => {
    const w = new Date(d);
    const day = w.getDay();
    w.setDate(w.getDate() - (day === 0 ? 6 : day - 1));
    w.setHours(0, 0, 0, 0);
    return w.getTime();
  };

  const weekCounts = new Map<number, number>();
  const monthCounts = new Map<string, number>();
  let hasEarlyBird = false;
  let hasNightRunner = false;
  let hasNoonRunner = false;

  for (const run of allRuns) {
    const wk = getWeekStart(new Date(run.date));
    weekCounts.set(wk, (weekCounts.get(wk) ?? 0) + 1);
    const mo = `${new Date(run.date).getFullYear()}-${new Date(run.date).getMonth()}`;
    monthCounts.set(mo, (monthCounts.get(mo) ?? 0) + 1);
    const h = new Date(run.createdAt).getHours();
    if (h < 8) hasEarlyBird = true;
    if (h >= 21) hasNightRunner = true;
    if (h >= 12 && h < 14) hasNoonRunner = true;
  }

  const maxRunsInWeek = weekCounts.size ? Math.max(...weekCounts.values()) : 0;
  const maxRunsInMonth = monthCounts.size ? Math.max(...monthCounts.values()) : 0;

  // Longest consecutive week streak (ever)
  const weekKeys = Array.from(weekCounts.keys()).sort((a, b) => a - b);
  let longestStreak = 0;
  let cur = 0;
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < weekKeys.length; i++) {
    if (i === 0 || weekKeys[i] - weekKeys[i - 1] > ONE_WEEK) cur = 1;
    else cur++;
    longestStreak = Math.max(longestStreak, cur);
  }

  // ── Revocation check ────────────────────────────────────────────────────────
  const toRevokeIds: string[] = [];
  const toRevokeSlugs: string[] = [];

  for (const ub of earnedBadges) {
    const slug = ub.badge.slug;
    let stillValid = true;
    switch (slug) {
      case "first-run":       stillValid = totalRuns >= 1; break;
      case "5km-total":       stillValid = totalKm >= 5; break;
      case "10km":            stillValid = totalKm >= 10; break;
      case "100km":           stillValid = totalKm >= 100; break;
      case "500km-total":     stillValid = totalKm >= 500; break;
      case "personal-record": stillValid = hasPersonalRecord; break;
      case "10km-single":     stillValid = maxSingleKm >= 10; break;
      case "sub-6-pace":      stillValid = minPace < 6; break;
      case "half-marathon":   stillValid = maxSingleKm >= 21.1; break;
      case "marathon":        stillValid = maxSingleKm >= 42.195; break;
      case "streak-2":        stillValid = longestStreak >= 2; break;
      case "streak-4":        stillValid = longestStreak >= 4; break;
      case "streak-7":        stillValid = longestStreak >= 7; break;
      case "week-3runs":      stillValid = maxRunsInWeek >= 3; break;
      case "week-5runs":      stillValid = maxRunsInWeek >= 5; break;
      case "month-20runs":    stillValid = maxRunsInMonth >= 20; break;
      case "early-bird":      stillValid = hasEarlyBird; break;
      case "night-runner":    stillValid = hasNightRunner; break;
      case "100-points":      stillValid = newTotalPoints >= 100; break;
      case "500-points":      stillValid = newTotalPoints >= 500; break;
      case "1000-points":     stillValid = newTotalPoints >= 1000; break;
      case "5000-points":     stillValid = newTotalPoints >= 5000; break;
      case "level-5":         stillValid = newLevel >= 5; break;
      // Distance cumulée (nouveaux)
      case "25km-total":      stillValid = totalKm >= 25; break;
      case "50km-total":      stillValid = totalKm >= 50; break;
      case "250km-total":     stillValid = totalKm >= 250; break;
      case "1000km-total":    stillValid = totalKm >= 1000; break;
      // Distance sortie unique (nouveaux)
      case "5km-single":      stillValid = maxSingleKm >= 5; break;
      case "15km-single":     stillValid = maxSingleKm >= 15; break;
      case "30km-single":     stillValid = maxSingleKm >= 30; break;
      case "ultra":           stillValid = maxSingleKm >= 50; break;
      // Vitesse & Durée (nouveaux)
      case "sub-5-pace":      stillValid = minPace < 5; break;
      case "sub-4-pace":      stillValid = minPace < 4; break;
      case "1h-run":          stillValid = maxSingleDuration >= 60; break;
      case "2h-run":          stillValid = maxSingleDuration >= 120; break;
      // Régularité (nouveaux)
      case "10-runs":         stillValid = totalRuns >= 10; break;
      case "50-runs":         stillValid = totalRuns >= 50; break;
      case "100-runs":        stillValid = totalRuns >= 100; break;
      case "streak-12":       stillValid = longestStreak >= 12; break;
      case "month-10runs":    stillValid = maxRunsInMonth >= 10; break;
      // Moments (nouveaux)
      case "noon-runner":     stillValid = hasNoonRunner; break;
      case "comeback":        stillValid = true; break; // non révocable
      // Prestige (nouveau)
      case "10000-points":    stillValid = newTotalPoints >= 10000; break;
      // Badges programme
      case "program-first":   stillValid = programRunCount >= 1; break;
      default:                stillValid = true; break;
    }
    if (!stillValid) {
      toRevokeIds.push(ub.id);
      toRevokeSlugs.push(slug);
    }
  }

  if (toRevokeIds.length > 0) {
    await prisma.userBadge.deleteMany({ where: { id: { in: toRevokeIds } } });
  }

  return toRevokeSlugs;
}

// Vérifie les badges liés au programme (appelé après validation d'une séance)
export async function checkAndAwardProgramBadges(userId: string): Promise<string[]> {
  const [allBadges, earnedBadges, completedSessions] = await Promise.all([
    prisma.badge.findMany({ where: { slug: { startsWith: "program-" } } }),
    prisma.userBadge.findMany({ where: { userId }, select: { badge: { select: { slug: true } } } }),
    prisma.userProgramSession.findMany({
      where: { userId, programId: PROGRAM_ID, completed: true },
      select: { day: true, runId: true },
    }),
  ]);

  const earnedSlugs = new Set(earnedBadges.map((b) => b.badge.slug));
  const completedDays = new Set(completedSessions.map((s) => s.day));
  const completedCount = completedDays.size;
  const runBackedCount = completedSessions.filter(s => s.runId).length;

  // Semaine 1 complète = toutes les séances non-repos de S1 validées
  const week1Active = SESSIONS.filter(s => s.week === 1 && s.type !== "Repos").map(s => s.day);
  const week1Done = week1Active.every(d => completedDays.has(d));

  // Programme complet = toutes séances non-repos validées
  const allActive = SESSIONS.filter(s => s.type !== "Repos").map(s => s.day);
  const allDone = allActive.every(d => completedDays.has(d));

  const should = (slug: string, cond: boolean) => cond && !earnedSlugs.has(slug);

  const toAward = allBadges.filter((b) => {
    switch (b.slug) {
      case "program-first":    return should(b.slug, runBackedCount >= 1);
      case "program-week1":    return should(b.slug, week1Done);
      case "program-10":       return should(b.slug, completedCount >= 10);
      case "program-halfway":  return should(b.slug, completedCount >= 28);
      case "program-complete": return should(b.slug, allDone);
      default:                 return false;
    }
  });

  if (toAward.length === 0) return [];

  await prisma.userBadge.createMany({
    data: toAward.map((b) => ({ userId, badgeId: b.id })),
    skipDuplicates: true,
  });

  return toAward.map((b) => b.slug);
}
