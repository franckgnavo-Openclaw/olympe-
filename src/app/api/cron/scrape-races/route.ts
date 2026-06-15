import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

// Distance mappings from common French race labels
const DISTANCE_MAP: Record<string, number> = {
  "5 km": 5, "5km": 5,
  "10 km": 10, "10km": 10,
  "semi-marathon": 21.1, "semi marathon": 21.1, "21 km": 21.1, "21km": 21.1,
  "marathon": 42.195, "42 km": 42.2, "42km": 42.2,
  "trail": 20, // default trail distance
};

function parseDistance(label: string): number {
  const lower = label.toLowerCase();
  for (const [key, val] of Object.entries(DISTANCE_MAP)) {
    if (lower.includes(key)) return val;
  }
  // Try to extract a number like "15 km" or "15km"
  const m = lower.match(/(\d+[\.,]?\d*)\s*km/);
  if (m) return parseFloat(m[1].replace(",", "."));
  return 0;
}

function parseDate(str: string): Date | null {
  // Formats: "15/06/2025", "15-06-2025", "2025-06-15"
  const clean = str.trim();
  let m = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T09:00:00`);
  m = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T09:00:00`);
  m = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T09:00:00`);
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function slugify(name: string, city: string, date: string): string {
  return `cp-${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}-${city.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 20)}-${date}`;
}

async function scrapeCourseAPied(): Promise<number> {
  // courseapied.net calendar page — public, no auth required
  const BASE = "https://www.courseapied.net";
  const now = new Date();
  const months = [
    `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`,
    `${now.getFullYear()}/${String(now.getMonth() + 2).padStart(2, "0")}`,
    `${now.getFullYear()}/${String(now.getMonth() + 3).padStart(2, "0")}`,
  ].map(m => m.replace("/13", "/01").replace("/14", "/02")); // handle December edge case

  let upserted = 0;

  for (const monthPath of months) {
    try {
      const url = `${BASE}/calendrier/${monthPath}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; OlympeBot/1.0)" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // courseapied.net lists races in table rows with class "course"
      $("tr.course, .liste-courses tr, table.calendrier tr").each((_, el) => {
        const cells = $(el).find("td");
        if (cells.length < 3) return;

        const dateStr = $(cells[0]).text().trim();
        const nameEl = $(cells[1]);
        const name = nameEl.find("a").first().text().trim() || nameEl.text().trim();
        const href = nameEl.find("a").first().attr("href") ?? "";
        const cityRaw = $(cells[2]).text().trim();
        const distLabel = $(cells[3] ?? cells[2]).text().trim();

        const date = parseDate(dateStr);
        if (!date || !name || date < new Date()) return;

        const distanceKm = parseDistance(distLabel || name);
        if (distanceKm === 0) return;

        const city = cityRaw.replace(/\(\d+\)/, "").trim();
        const deptMatch = cityRaw.match(/\((\d{2,3})\)/);
        const department = deptMatch ? deptMatch[1] : undefined;
        const registrationUrl = href.startsWith("http") ? href : href ? `${BASE}${href}` : undefined;

        const externalId = slugify(name, city, date.toISOString().split("T")[0]);

        prisma.race.upsert({
          where: { externalId },
          update: { name, date, city, department, distanceKm, registrationUrl, updatedAt: new Date() },
          create: { externalId, name, date, city, department: department ?? null, distanceKm, registrationUrl: registrationUrl ?? null, source: "courseapied" },
        }).catch(() => { /* skip duplicates */ });

        upserted++;
      });

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 500));
    } catch {
      // Continue to next month if one fails
    }
  }

  return upserted;
}

async function scrapeRunningCalendar(): Promise<number> {
  // runagain.fr — alternative French race aggregator
  const BASE = "https://www.runagain.fr";
  let upserted = 0;

  try {
    const res = await fetch(`${BASE}/calendrier-courses-a-pied`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OlympeBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return 0;

    const html = await res.text();
    const $ = cheerio.load(html);

    $(".event-item, .course-item, article.event").each((_, el) => {
      const name = $(el).find(".event-title, .course-name, h3, h2").first().text().trim();
      const dateStr = $(el).find(".event-date, .date, time").first().text().trim();
      const city = $(el).find(".event-city, .ville, .location").first().text().trim();
      const distLabel = $(el).find(".distance, .km").first().text().trim();
      const href = $(el).find("a").first().attr("href") ?? "";

      const date = parseDate(dateStr);
      if (!date || !name || !city || date < new Date()) return;

      const distanceKm = parseDistance(distLabel || name);
      if (distanceKm === 0) return;

      const registrationUrl = href.startsWith("http") ? href : href ? `${BASE}${href}` : undefined;
      const externalId = slugify(name, city, date.toISOString().split("T")[0]);

      prisma.race.upsert({
        where: { externalId },
        update: { name, date, city, distanceKm, registrationUrl, updatedAt: new Date() },
        create: { externalId, name, date, city, distanceKm, registrationUrl: registrationUrl ?? null, source: "runagain" },
      }).catch(() => { });

      upserted++;
    });
  } catch {
    // Silently skip if this source fails
  }

  return upserted;
}

export async function GET(req: NextRequest) {
  // Protect the cron endpoint
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [n1, n2] = await Promise.all([
      scrapeCourseAPied(),
      scrapeRunningCalendar(),
    ]);

    // Clean up past races older than 30 days
    await prisma.race.deleteMany({
      where: { date: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    return NextResponse.json({ ok: true, scraped: n1 + n2, sources: { courseapied: n1, runagain: n2 } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
