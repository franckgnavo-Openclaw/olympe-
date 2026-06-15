import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function probe(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36", "Accept": "text/html,application/xhtml+xml,application/json,*/*" },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    const text = await res.text();
    const $ = cheerio.load(text);

    // Count meaningful content elements
    const links = $("a[href]").length;
    const tables = $("table").length;
    const lis = $("li").length;

    // Sample of visible text
    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 500);

    return { status: res.status, htmlLength: text.length, links, tables, lis, bodyText };
  } catch (e) {
    return { status: 0, htmlLength: 0, links: 0, tables: 0, lis: 0, bodyText: String(e) };
  }
}

export async function GET() {
  const candidates: Record<string, string> = {
    // FFA officiel
    "ffa_calendar": "https://bases.athle.fr/asp.net/liste.aspx?frmpostback=true&frmbase=calendrier&frmmode=1&frmespace=0",
    // Finishers.com
    "finishers": "https://www.finishers.com/fr/agenda",
    "finishers_json": "https://api.finishers.com/v1/events?country=FR&limit=20",
    // BeRun
    "berun": "https://www.berun.fr/calendrier",
    // Maracourses
    "maracourses": "https://www.maracourses.com/calendrier.html",
    // Running Heroes
    "runningheroes": "https://www.runningheroes.com/fr/challenges",
    // OpenAgenda (free API)
    "openagenda": "https://api.openagenda.com/v2/agendas/52611938/events?size=20&relative[]=current&relative[]=upcoming",
    // Jogging-Plus
    "joggingplus": "https://www.jogging-plus.com/calendrier-courses.html",
    // Time to Run
    "timetorun": "https://www.time-to-run.com/calendrier/",
    // Klikego JSON guess
    "klikego_json": "https://www.klikego.com/api/calendrier",
    "klikego_ajax": "https://www.klikego.com/ajax/calendar",
    "klikego_events": "https://www.klikego.com/evenements/france",
  };

  const results: Record<string, unknown> = {};
  for (const [key, url] of Object.entries(candidates)) {
    results[key] = await probe(url);
    await new Promise(r => setTimeout(r, 200));
  }

  return NextResponse.json(results);
}
