import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const distMin = parseFloat(searchParams.get("distMin") ?? "0") || 0;
  const distMax = parseFloat(searchParams.get("distMax") ?? "999") || 999;
  const city    = searchParams.get("city")?.trim() ?? "";
  const from    = searchParams.get("from");
  const to      = searchParams.get("to");
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);

  const races = await prisma.race.findMany({
    where: {
      distanceKm: { gte: distMin, lte: distMax },
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      date: {
        gte: from ? new Date(from) : new Date(),
        ...(to ? { lte: new Date(to) } : {}),
      },
    },
    orderBy: { date: "asc" },
    take: limit,
  });

  return NextResponse.json(races);
}
