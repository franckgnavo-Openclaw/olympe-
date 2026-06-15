import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROGRAMS, PROGRAM_ID } from "@/lib/program";
import { checkAndAwardProgramBadges, checkAndRevokeBadges } from "@/lib/badges";
import { PROGRAM_COMPLETION_BONUS, getLevel } from "@/lib/points";

// GET — récupère toutes les sessions de l'utilisateur
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const programId = req.nextUrl.searchParams.get("programId") ?? PROGRAM_ID;

  const sessions = await prisma.userProgramSession.findMany({
    where: { userId: session.user.id, programId },
  });

  return NextResponse.json(sessions);
}

// POST — marque une séance (ou la met à jour)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const programId: string = body.programId ?? PROGRAM_ID;
  const program = PROGRAMS[programId];
  if (!program) return NextResponse.json({ error: "Programme invalide" }, { status: 400 });

  const day = parseInt(body.day);
  const completed: boolean = body.completed ?? true;
  const notes: string | undefined = body.notes;
  const feeling: number | undefined = body.feeling ? parseInt(body.feeling) : undefined;
  const runId: string | null | undefined = body.runId;

  const maxDay = program.sessions.length;
  if (!day || day < 1 || day > maxDay) return NextResponse.json({ error: "Jour invalide" }, { status: 400 });

  const result = await prisma.userProgramSession.upsert({
    where: { userId_programId_day: { userId: session.user.id, programId, day } },
    create: {
      userId: session.user.id,
      programId,
      day,
      completed,
      completedAt: completed ? new Date() : null,
      notes: notes ?? null,
      feeling: feeling ?? null,
      runId: runId ?? null,
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
      ...(notes !== undefined && { notes }),
      ...(feeling !== undefined && { feeling }),
      ...(runId !== undefined && { runId }),
      ...(!completed && { runId: null }),
    },
  });

  const newBadges = completed ? await checkAndAwardProgramBadges(session.user.id) : [];

  if (!completed) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totalPoints: true, level: true } });
    if (user) await checkAndRevokeBadges(session.user.id, user.totalPoints, user.level);
  }

  let completionBonus = 0;
  if (newBadges.includes("program-complete")) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { totalPoints: true } });
    if (user) {
      const newTotal = user.totalPoints + PROGRAM_COMPLETION_BONUS;
      const { level } = getLevel(newTotal);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { totalPoints: newTotal, level },
      });
      completionBonus = PROGRAM_COMPLETION_BONUS;
    }
  }

  return NextResponse.json({ ...result, newBadges, completionBonus });
}
