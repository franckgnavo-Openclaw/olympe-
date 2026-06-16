import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

// Départements du Limousin
const LIMOUSIN_DEPTS = new Set(["19", "23", "87"]);

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

function parseOlenoDate(str: string): Date | null {
  const m = str.trim().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = FRENCH_MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return new Date(`${m[3]}-${month}-${m[1].padStart(2, "0")}T09:00:00`);
}

function parseKm(str: string): number {
  const m = str.match(/(\d+[\.,]?\d*)\s*km/i);
  if (m) return parseFloat(m[1].replace(",", "."));
  return 0;
}

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

function parseRaces(html: string, deptFilter?: Set<string>): RaceData[] {
  const $ = cheerio.load(html);
  const races: RaceData[] = [];

  $("a[href^='/courses/']").each((_i, el) => {
    const href = $(el).attr("href") ?? "";
    const name = $(el).find("h3").text().trim();
    if (!name) return;

    const distSpan = $(el).find("span").filter((_j, s) => /\d+[\.,]?\d*\s*km/i.test($(s).text())).first().text().trim();
    const ps = $(el).find("p").map((_j, p) => $(p).text().replace(/\s+/g, " ").trim()).get();
    const dateStr = ps.find(p => /\d{4}/.test(p)) ?? "";
    const lieuStr = ps.find(p => /\(\d{2,3}\)/.test(p)) ?? "";

    const date = parseOlenoDate(dateStr);
    if (!date || date < new Date(Date.now() - 86400000)) return;

    const { city, department } = parseLieu(lieuStr);
    if (!city) return;

    // Filtre départemental si demandé
    if (deptFilter && department && !deptFilter.has(department)) return;

    const distanceKm = parseKm(distSpan);
    const registrationUrl = `https://oleno.fr${href}`;
    const externalId = `oleno-${slugify(name)}-${slugify(city)}-${date.toISOString().split("T")[0]}`;

    races.push({ externalId, name, date, city, department: department || null, distanceKm, registrationUrl, source: "oleno" });
  });

  return races;
}

async function scrapeRegion(regionSlug: string, deptFilter?: Set<string>): Promise<number> {
  const baseUrl = `https://oleno.fr/course-a-pied/${regionSlug}`;
  let total = 0;

  for (let page = 1; page <= 10; page++) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    try {
      const html = await fetchPage(url);
      const races = parseRaces(html, deptFilter);
      if (races.length === 0) break; // Plus de résultats

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
      await new Promise(r => setTimeout(r, 400));
    } catch {
      break;
    }
  }

  return total;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Scraper IDF et Nouvelle-Aquitaine (filtré Limousin) en parallèle
    const [idf, limousin] = await Promise.all([
      scrapeRegion("ile-de-france"),
      scrapeRegion("nouvelle-aquitaine", LIMOUSIN_DEPTS),
    ]);

    // Nettoyer les courses passées de +30 jours
    await prisma.race.deleteMany({
      where: { date: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    const total = await prisma.race.count();
    return NextResponse.json({ ok: true, scraped: { idf, limousin, total: idf + limousin }, inDb: total });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
