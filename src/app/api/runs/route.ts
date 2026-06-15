import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRunPoints, getLevel } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";
import { computeStreaks } from "@/lib/streaks";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const runs = await prisma.run.findMany({
    where: { userId: session.user.id },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 20,
    select: {
      id: true,
      date: true,
      createdAt: true,
      distanceKm: true,
      durationMin: true,
      notes: true,
      feeling: true,
      pointsEarned: true,
      isPersonalRecord: true,
      isProgramRun: true,
      photoPreUrl: true,
      photoPostUrl: true,
    },
  });

  return NextResponse.json(runs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { date, distanceKm, durationMin, notes, isProgramRun, feeling } = await req.json();

  if (!date || !distanceKm || !durationMin) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const parsedDistance = parseFloat(distanceKm);
  const parsedDuration = parseInt(durationMin);
  const pace = parsedDuration / parsedDistance; // min/km

  // Personal record = meilleure distance sur un seul run (parmi les runs existants)
  const bestRun = await prisma.run.findFirst({
    where: { userId: user.id },
    orderBy: { distanceKm: "desc" },
  });
  const isPersonalRecord = !bestRun || parsedDistance > bestRun.distanceKm;

  // Points (streak provisoire basé sur l'état actuel, corrigé après création)
  const points = calculateRunPoints(parsedDistance, isPersonalRecord, user.currentStreak, !!isProgramRun);
  const newTotalPoints = user.totalPoints + points;
  const { level } = getLevel(newTotalPoints);

  const daysSinceLastRun = user.lastRunDate
    ? Math.floor((Date.now() - new Date(user.lastRunDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Créer le run
  const run = await prisma.run.create({
    data: {
      userId: user.id,
      date: new Date(date),
      distanceKm: parsedDistance,
      durationMin: parsedDuration,
      notes,
      feeling: feeling ?? null,
      pointsEarned: points,
      isPersonalRecord,
      isProgramRun: !!isProgramRun,
    },
  });

  // Recalculer le streak depuis TOUS les runs (y compris celui qui vient d'être créé)
  const allRuns = await prisma.run.findMany({ where: { userId: user.id }, select: { date: true } });
  const { currentStreak: newStreak, longestStreak: newLongest } = computeStreaks(allRuns.map(r => new Date(r.date)));

  // Runs cette semaine et ce mois (date du run entré, pas aujourd'hui)
  const runDate = new Date(date);
  const monday = new Date(runDate);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const monthStart = new Date(runDate.getFullYear(), runDate.getMonth(), 1);

  const runsThisWeek = allRuns.filter(r => new Date(r.date) >= monday).length;
  const runsThisMonth = allRuns.filter(r => new Date(r.date) >= monthStart).length;

  const totalKmAgg = await prisma.run.aggregate({ where: { userId: user.id }, _sum: { distanceKm: true } });
  const totalKmReal = totalKmAgg._sum.distanceKm ?? 0;
  const totalRuns = allRuns.length;

  // Mettre à jour les stats user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalPoints: newTotalPoints,
      level,
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newLongest),
      lastRunDate: new Date(date),
    },
  });

  // Vérifier et attribuer les badges
  const newBadges = await checkAndAwardBadges({
    userId: user.id,
    isPersonalRecord,
    newStreak,
    totalKm: totalKmReal,
    totalRuns,
    runsThisWeek,
    runsThisMonth,
    distanceKm: parsedDistance,
    durationMin: parsedDuration,
    pace,
    newTotalPoints,
    level,
    runHour: new Date().getHours(),
    daysSinceLastRun,
  });

  return NextResponse.json({ run, pointsEarned: points, isPersonalRecord, newStreak, newBadges }, { status: 201 });
}
