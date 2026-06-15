import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function probe(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const rows = $("tr").length;
    const tables = $("table").length;
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 400);
    return { status: res.status, htmlLength: html.length, rows, tables, bodyText };
  } catch (e) {
    return { status: 0, htmlLength: 0, rows: 0, tables: 0, bodyText: String(e) };
  }
}

export async function GET() {
  const candidates: Record<string, string> = {
    "france_marathon":     "https://www.france-marathon.com/calendrier.php",
    "semi_marathon_net":   "https://www.semi-marathon.net/calendrier.php",
    "10km_fr":             "https://www.10km.fr/calendrier/",
    "running_fr":          "https://www.running.fr/calendrier",
    "courir_agenda":       "https://www.courir.com/agenda",
    "joggingplus2":        "https://www.jogging-plus.com/calendrier-courses-a-pied.html",
    "athle_fr_cal":        "https://www.athle.fr/base/calendrier",
    "finishers_courses":   "https://www.finishers.com/fr/courses",
    "finishers_all":       "https://www.finishers.com/fr/toutes-les-courses",
    "lequipe_athl":        "https://www.lequipe.fr/Athletisme/Calendrier/",
    "sport24_cal":         "https://www.sport24.com/Athletisme/Calendrier/",
    "direct_athle":        "https://direct.athle.fr/asp.net/public.aspx/calendrier",
    "bases_athle_post":    "https://bases.athle.fr/asp.net/liste.aspx",
  };

  const results: Record<string, unknown> = {};
  for (const [key, url] of Object.entries(candidates)) {
    results[key] = await probe(url);
    await new Promise(r => setTimeout(r, 300));
  }

  return NextResponse.json(results);
}
