import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/points";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      totalPoints: true,
      level: true,
      currentStreak: true,
      _count: { select: { runs: true } },
      runs: { select: { distanceKm: true } },
    },
    orderBy: { totalPoints: "desc" },
    take: 20,
  });

  const leaderboard = users.map((u: typeof users[number], i: number) => ({
    rank: i + 1,
    id: u.id,
    name: u.name ?? "Anonyme",
    image: u.image,
    totalPoints: u.totalPoints,
    level: getLevel(u.totalPoints).name,
    levelNum: u.level,
    streak: u.currentStreak,
    runsCount: u._count.runs,
    totalKm: u.runs.reduce((sum: number, r: { distanceKm: number }) => sum + r.distanceKm, 0),
  }));

  return NextResponse.json(leaderboard);
}
