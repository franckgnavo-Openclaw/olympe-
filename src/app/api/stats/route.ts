import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { runs: { select: { distanceKm: true, durationMin: true, date: true } } },
  });

  if (!user) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const totalKm = user.runs.reduce((s, r) => s + r.distanceKm, 0);
  const totalMin = user.runs.reduce((s, r) => s + r.durationMin, 0);

  const lastRunDate = user.runs.length > 0
    ? user.runs.reduce((latest, r) => r.date > latest ? r.date : latest, user.runs[0].date)
    : null;

  return NextResponse.json({
    totalKm,
    totalRuns: user.runs.length,
    totalMin,
    totalPoints: user.totalPoints,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    level: user.level,
    lastRunDate,
  });
}
