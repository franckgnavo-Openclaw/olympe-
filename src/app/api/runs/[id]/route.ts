import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/points";
import { checkAndAwardBadges, checkAndRevokeBadges } from "@/lib/badges";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const run = await prisma.run.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!run) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  return NextResponse.json(run);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.run.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  const newDistanceKm = body.distanceKm !== undefined ? parseFloat(body.distanceKm) : existing.distanceKm;
  const newDurationMin = body.durationMin !== undefined ? parseInt(body.durationMin) : existing.durationMin;
  const newDate       = body.date !== undefined ? new Date(body.date) : existing.date;
  const newNotes      = body.notes !== undefined ? (body.notes || null) : existing.notes;

  // ── 1. Adjust pointsEarned preserving original streak/program bonuses ────────
  // Delta on distance pts (2 pt per km floor) + PR bonus change
  const oldDistancePts = Math.floor(existing.distanceKm) * 2;
  const newDistancePts = Math.floor(newDistanceKm) * 2;

  // Replay all runs chronologically to determine new isPersonalRecord
  const otherRuns = await prisma.run.findMany({
    where: { userId: session.user.id, id: { not: id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, distanceKm: true, isPersonalRecord: true, createdAt: true },
  });

  // Insert this run at its position by createdAt
  const allChron = [...otherRuns, { id, distanceKm: newDistanceKm, isPersonalRecord: existing.isPersonalRecord, createdAt: existing.createdAt }]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  let maxKm = 0;
  const prUpdates: { id: string; isPR: boolean }[] = [];
  for (const r of allChron) {
    const isPR = r.distanceKm > maxKm;
    if (isPR !== r.isPersonalRecord) prUpdates.push({ id: r.id, isPR });
    if (r.distanceKm > maxKm) maxKm = r.distanceKm;
  }

  const newIsPersonalRecord = newDistanceKm > (otherRuns.reduce((m, r) => Math.max(m, r.distanceKm), 0));

  const oldPRBonus = existing.isPersonalRecord ? 25 : 0;
  const newPRBonus = newIsPersonalRecord ? 25 : 0;
  const newPointsEarned = Math.max(10, existing.pointsEarned - oldDistancePts + newDistancePts - oldPRBonus + newPRBonus);

  // ── 2. Update the run ────────────────────────────────────────────────────────
  const updated = await prisma.run.update({
    where: { id },
    data: { distanceKm: newDistanceKm, durationMin: newDurationMin, date: newDate, notes: newNotes, pointsEarned: newPointsEarned, isPersonalRecord: newIsPersonalRecord },
  });

  // Apply PR flag corrections on other runs
  await Promise.all(prUpdates.filter(u => u.id !== id).map(u =>
    prisma.run.update({ where: { id: u.id }, data: { isPersonalRecord: u.isPR } })
  ));

  // ── 3. Recompute user totals ─────────────────────────────────────────────────
  const allRuns = await prisma.run.findMany({ where: { userId: session.user.id } });
  const newTotalPoints = allRuns.reduce((s, r) => s + r.pointsEarned, 0);
  const { level: newLevel } = getLevel(newTotalPoints);

  // Recompute streak
  const getWeekStart = (d: Date) => {
    const w = new Date(d); const day = w.getDay();
    w.setDate(w.getDate() - (day === 0 ? 6 : day - 1)); w.setHours(0, 0, 0, 0);
    return w.getTime();
  };
  const weekSet = new Set(allRuns.map(r => getWeekStart(new Date(r.date))));
  const weekKeys = Array.from(weekSet).sort((a, b) => a - b);
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  let longestStreak = 0, curStreak = 0;
  for (let i = 0; i < weekKeys.length; i++) {
    curStreak = (i === 0 || weekKeys[i] - weekKeys[i - 1] > ONE_WEEK) ? 1 : curStreak + 1;
    longestStreak = Math.max(longestStreak, curStreak);
  }
  const thisWeek = getWeekStart(new Date());
  const lastRunWeek = weekKeys[weekKeys.length - 1] ?? 0;
  const currentStreak = lastRunWeek >= thisWeek - ONE_WEEK ? curStreak : 0;

  // ── 4. Badge revocation ──────────────────────────────────────────────────────
  const revokedBadges = await checkAndRevokeBadges(session.user.id, newTotalPoints, newLevel);

  // ── 5. Badge award — build context from edited run + current totals ──────────
  const totalKm = allRuns.reduce((s, r) => s + r.distanceKm, 0);
  const pace = newDurationMin / newDistanceKm;
  const runDate = new Date(newDate);
  const weekStart = getWeekStart(runDate);
  const monthKey = `${runDate.getFullYear()}-${runDate.getMonth()}`;
  const runsThisWeek = allRuns.filter(r => getWeekStart(new Date(r.date)) === weekStart).length;
  const runsThisMonth = allRuns.filter(r => {
    const d = new Date(r.date);
    return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
  }).length;

  const newBadges = await checkAndAwardBadges({
    userId: session.user.id,
    isPersonalRecord: newIsPersonalRecord,
    newStreak: currentStreak,
    totalKm,
    totalRuns: allRuns.length,
    runsThisWeek,
    runsThisMonth,
    distanceKm: newDistanceKm,
    durationMin: newDurationMin,
    pace,
    newTotalPoints,
    level: newLevel,
    runHour: new Date(existing.createdAt).getHours(),
    daysSinceLastRun: null,
  });

  // ── 6. Update user ───────────────────────────────────────────────────────────
  const sortedByDate = [...allRuns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totalPoints: newTotalPoints, level: newLevel, currentStreak, longestStreak, lastRunDate: sortedByDate[0]?.date ?? null },
  });

  return NextResponse.json({ ...updated, newBadges, revokedBadges });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const run = await prisma.run.findFirst({ where: { id, userId: session.user.id } });
  if (!run) return NextResponse.json({ error: "Run introuvable" }, { status: 404 });

  await prisma.run.delete({ where: { id } });

  // ── Recalculate points from all remaining runs ──────────────────────────────
  const allRuns = await prisma.run.findMany({ where: { userId: session.user.id } });
  const newTotalPoints = allRuns.reduce((s, r) => s + r.pointsEarned, 0);
  const { level: newLevel } = getLevel(newTotalPoints);

  // ── Recompute weekly streak ─────────────────────────────────────────────────
  const getWeekStart = (d: Date) => {
    const w = new Date(d);
    const day = w.getDay();
    w.setDate(w.getDate() - (day === 0 ? 6 : day - 1));
    w.setHours(0, 0, 0, 0);
    return w.getTime();
  };

  const weekSet = new Set(allRuns.map(r => getWeekStart(new Date(r.date))));
  const weekKeys = Array.from(weekSet).sort((a, b) => a - b);
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  let longestStreak = 0;
  let curStreak = 0;
  for (let i = 0; i < weekKeys.length; i++) {
    if (i === 0 || weekKeys[i] - weekKeys[i - 1] > ONE_WEEK) curStreak = 1;
    else curStreak++;
    longestStreak = Math.max(longestStreak, curStreak);
  }

  const thisWeek = getWeekStart(new Date());
  const lastRunWeek = weekKeys[weekKeys.length - 1] ?? 0;
  const currentStreak = lastRunWeek >= thisWeek - ONE_WEEK ? curStreak : 0;

  // ── Revoke badges no longer valid ──────────────────────────────────────────
  const revokedBadges = await checkAndRevokeBadges(session.user.id, newTotalPoints, newLevel);

  // ── Update user ─────────────────────────────────────────────────────────────
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      totalPoints: newTotalPoints,
      level: newLevel,
      currentStreak,
      longestStreak,
      lastRunDate: allRuns.length > 0
        ? allRuns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : null,
    },
  });

  return NextResponse.json({ ok: true, revokedBadges });
}
