import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const url = "https://www.klikego.com/resultats/calendrier/1";

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Count hits for likely selectors
  const selectors = [
    "tr", "table", "li", "article",
    "[class*='event']", "[class*='race']", "[class*='course']", "[class*='cal']",
    "[class*='result']", "[class*='item']", "[class*='row']", "[class*='card']",
    ".event", ".race", ".item", ".row", ".card", ".course",
  ];
  const selectorHits: Record<string, number> = {};
  for (const s of selectors) selectorHits[s] = $(s).length;

  // Top 40 class names in the page
  const classCounts: Record<string, number> = {};
  $("[class]").each((_, el) => {
    const classes = ($(el).attr("class") ?? "").split(/\s+/).filter(Boolean);
    for (const c of classes) {
      classCounts[c] = (classCounts[c] ?? 0) + 1;
    }
  });
  const topClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]).slice(0, 40);

  // First <tr> content sample
  const firstRows: string[] = [];
  $("tr").slice(0, 5).each((_i, el) => { firstRows.push($(el).text().replace(/\s+/g, " ").trim().slice(0, 200)); return true; });

  // First <li> content sample
  const firstLis: string[] = [];
  $("li").slice(0, 5).each((_i, el) => { firstLis.push($(el).text().replace(/\s+/g, " ").trim().slice(0, 200)); return true; });

  // Find all links containing "course" or "run" or a date pattern
  const raceLinks: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim().slice(0, 100);
    if (href.match(/course|race|event|calend|inscri/i) || text.match(/\d{2}\/\d{2}\/\d{4}/)) {
      raceLinks.push(`${text} → ${href}`);
    }
  });

  // Raw HTML middle section (more likely to contain data than the header)
  const htmlMiddle = html.slice(3000, 7000);

  return NextResponse.json({
    status: res.status,
    htmlLength: html.length,
    selectorHits,
    topClasses,
    firstRows,
    firstLis,
    raceLinksCount: raceLinks.length,
    raceLinksSample: raceLinks.slice(0, 20),
    htmlMiddle,
  });
}
