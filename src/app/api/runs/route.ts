import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateRunPoints, getLevel } from "@/lib/points";
import { checkAndAwardBadges } from "@/lib/badges";

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

  // Personal record = meilleure distance sur un seul run
  const bestRun = await prisma.run.findFirst({
    where: { userId: user.id },
    orderBy: { distanceKm: "desc" },
  });
  const isPersonalRecord = !bestRun || parseFloat(distanceKm) > bestRun.distanceKm;

  // Streak hebdomadaire (lundi → dimanche)
  const getWeekStart = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const thisWeekStart = getWeekStart(new Date());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  let newStreak: number;
  if (!user.lastRunDate) {
    newStreak = 1;
  } else {
    const lastRunWeekStart = getWeekStart(user.lastRunDate);
    if (lastRunWeekStart.getTime() === thisWeekStart.getTime()) {
      newStreak = user.currentStreak;
    } else if (lastRunWeekStart.getTime() === lastWeekStart.getTime()) {
      newStreak = user.currentStreak + 1;
    } else {
      newStreak = 1;
    }
  }

  const parsedDistance = parseFloat(distanceKm);
  const parsedDuration = parseInt(durationMin);
  const pace = parsedDuration / parsedDistance; // min/km

  const points = calculateRunPoints(parsedDistance, isPersonalRecord, newStreak, !!isProgramRun);
  const newTotalPoints = user.totalPoints + points;
  const { level } = getLevel(newTotalPoints);

  // Runs cette semaine
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const runsThisWeek = await prisma.run.count({
    where: { userId: user.id, date: { gte: monday } },
  });

  // Runs ce mois
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const runsThisMonth = await prisma.run.count({
    where: { userId: user.id, date: { gte: monthStart } },
  });

  // Total km cumulés (incluant ce run)
  const kmAgg = await prisma.run.aggregate({
    where: { userId: user.id },
    _sum: { distanceKm: true },
  });
  const totalKm = (kmAgg._sum.distanceKm ?? 0) + parsedDistance;
  const totalRuns = (bestRun ? await prisma.run.count({ where: { userId: user.id } }) : 0) + 1;

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

  // Mettre à jour les stats user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      totalPoints: newTotalPoints,
      level,
      currentStreak: newStreak,
      longestStreak: Math.max(user.longestStreak, newStreak),
      lastRunDate: new Date(),
    },
  });

  const daysSinceLastRun = user.lastRunDate
    ? Math.floor((Date.now() - new Date(user.lastRunDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Vérifier et attribuer les badges
  const newBadges = await checkAndAwardBadges({
    userId: user.id,
    isPersonalRecord,
    newStreak,
    totalKm,
    totalRuns,
    runsThisWeek: runsThisWeek + 1,
    runsThisMonth: runsThisMonth + 1,
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
