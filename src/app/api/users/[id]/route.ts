import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/points";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      totalPoints: true,
      level: true,
      currentStreak: true,
      longestStreak: true,
      createdAt: true,
      runs: {
        select: { distanceKm: true, durationMin: true, pointsEarned: true },
      },
      badges: {
        select: {
          earnedAt: true,
          badge: { select: { slug: true, name: true, emoji: true, description: true } },
        },
        orderBy: { earnedAt: "asc" },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const totalKm = user.runs.reduce((s, r) => s + r.distanceKm, 0);
  const totalMin = user.runs.reduce((s, r) => s + r.durationMin, 0);
  const levelInfo = getLevel(user.totalPoints);

  const programSessions = await prisma.userProgramSession.findMany({
    where: { userId: id, completed: true },
    select: { day: true, completedAt: true },
    orderBy: { day: "asc" },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name ?? "Anonyme",
    image: user.image,
    totalPoints: user.totalPoints,
    level: user.level,
    levelName: levelInfo.name,
    nextLevelPoints: levelInfo.nextLevelPoints,
    currentLevelMin: levelInfo.currentLevelMin,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalKm,
    totalMin,
    totalRuns: user.runs.length,
    joinedAt: user.createdAt,
    badges: user.badges,
    programSessions,
  });
}
