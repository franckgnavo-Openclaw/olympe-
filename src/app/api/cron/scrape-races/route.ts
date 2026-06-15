import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

const MONTH_SLUGS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

// "17 juin 2026" or "1 - 5 juillet 2026" → Date (first date)
function parseOlenoDate(str: string): Date | null {
  const m = str.trim().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = FRENCH_MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return new Date(`${m[3]}-${month}-${m[1].padStart(2, "0")}T09:00:00`);
}

// "10 km" or "12.8 km" → number
function parseKm(str: string): number {
  const m = str.match(/(\d+[\.,]?\d*)\s*km/i);
  if (m) return parseFloat(m[1].replace(",", "."));
  return 0;
}

// "Montlebon, Doubs (25)" → { city, department }
function parseLieu(str: string): { city: string; department: string } {
  const m = str.match(/^(.+?),\s*.+?\((\d{2,3})\)$/);
  if (m) return { city: m[1].trim(), department: m[2] };
  return { city: str.split(",")[0].trim(), department: "" };
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,*/*",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

interface RaceData {
  externalId: string;
  name: string;
  date: Date;
  city: string;
  department: string | null;
  distanceKm: number;
  registrationUrl: string | null;
  source: string;
}

function parseRaces(html: string): RaceData[] {
  const $ = cheerio.load(html);
  const races: RaceData[] = [];

  $("a[href^='/courses/']").each((_i, el) => {
    const href = $(el).attr("href") ?? "";
    const name = $(el).find("h3").text().trim();
    if (!name) return;

    // spans: type badge + distance badges
    const distSpan = $(el).find("span").filter((_j, s) => /\d+[\.,]?\d*\s*km/i.test($(s).text())).first().text().trim();

    // p tags: p[0] = date, p[1] = location
    const ps = $(el).find("p").map((_j, p) => $(p).text().replace(/\s+/g, " ").trim()).get();
    const dateStr = ps.find(p => /\d{4}/.test(p)) ?? "";
    const lieuStr = ps.find(p => /\(\d{2,3}\)/.test(p)) ?? "";

    const date = parseOlenoDate(dateStr);
    if (!date || date < new Date(Date.now() - 86400000)) return;

    const { city, department } = parseLieu(lieuStr);
    if (!city) return;

    const distanceKm = parseKm(distSpan);
    const registrationUrl = `https://oleno.fr${href}`;
    const externalId = `oleno-${slugify(name)}-${slugify(city)}-${date.toISOString().split("T")[0]}`;

    races.push({ externalId, name, date, city, department: department || null, distanceKm, registrationUrl, source: "oleno" });
  });

  return races;
}

async function scrapeOleno(): Promise<number> {
  const now = new Date();
  const monthsToScrape: string[] = [];

  // Build list of next 6 months as "mois-année"
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const slug = MONTH_SLUGS[d.getMonth()];
    monthsToScrape.push(`${slug}-${d.getFullYear()}`);
  }

  let total = 0;

  for (const monthSlug of monthsToScrape) {
    const url = `https://oleno.fr/course-a-pied/calendrier/${monthSlug}`;
    try {
      const html = await fetchPage(url);
      const races = parseRaces(html);

      // Upsert all races in parallel
      await Promise.all(races.map(r =>
        prisma.race.upsert({
          where: { externalId: r.externalId },
          update: {
            name: r.name, date: r.date, city: r.city,
            department: r.department, distanceKm: r.distanceKm,
            registrationUrl: r.registrationUrl, updatedAt: new Date(),
          },
          create: r,
        }).catch(() => { })
      ));

      total += races.length;
    } catch {
      // Skip failed months
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return total;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scraped = await scrapeOleno();

    // Clean up past races older than 30 days
    await prisma.race.deleteMany({
      where: { date: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    const total = await prisma.race.count();
    return NextResponse.json({ ok: true, scraped, total });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
