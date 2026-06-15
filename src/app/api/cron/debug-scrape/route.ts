import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

async function fetchHtml(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,*/*",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
    signal: AbortSignal.timeout(20000),
    redirect: "follow",
  });
  return res.text();
}

export async function GET() {
  const html = await fetchHtml("https://www.athle.fr/base/calendrier");
  const $ = cheerio.load(html);

  // Find race rows: tr with exactly 8 td children (Date, Libellé, Lieu, Type, Niveau, Label, Fiche, Résultats)
  const raceRows: Array<Record<string, string>> = [];
  const fichLinks: string[] = [];

  $("tr").each((_i, tr) => {
    const tds = $(tr).find("td");
    if (tds.length >= 6) {
      const date = $(tds[0]).text().trim();
      const name = $(tds[1]).text().trim();
      const lieu = $(tds[2]).text().trim();
      const type = $(tds[3]).text().trim();
      const niveau = $(tds[4]).text().trim();
      // Fiche link (td index 6 usually)
      const ficheLink = $(tds[6]).find("a").attr("href") ?? $(tds[5]).find("a").attr("href") ?? "";
      if (date && name && /\d{1,2}\s+\w+/.test(date)) {
        raceRows.push({ date, name, lieu, type, niveau, ficheLink });
        if (ficheLink) fichLinks.push(ficheLink);
      }
    }
    return true;
  });

  // Fetch a Running fiche to see if distance is there
  const runningIdx = raceRows.findIndex(r => r.type.includes("Running"));
  const ficheTarget = fichLinks[runningIdx] ?? fichLinks[0];
  let ficheExample: Record<string, unknown> = {};
  if (ficheTarget) {
    try {
      const ficheUrl = ficheTarget.startsWith("http") ? ficheTarget : `https://www.athle.fr${ficheTarget}`;
      const ficheHtml = await fetchHtml(ficheUrl);
      const $f = cheerio.load(ficheHtml);
      const distMatch = ficheHtml.match(/(\d+[\s,.]?\d*)\s*(km|kilomètre|mètre)\b/gi);
      ficheExample = {
        url: ficheUrl,
        // body text from char 800 onwards (skip nav)
        bodyMid: $f("body").text().replace(/\s+/g, " ").trim().slice(800, 2500),
        tableText: $f("table").first().text().replace(/\s+/g, " ").trim().slice(0, 600),
        distanceMatches: distMatch?.slice(0, 10) ?? [],
      };
    } catch (e) {
      ficheExample = { error: String(e) };
    }
  }

  return NextResponse.json({
    totalRaceRows: raceRows.length,
    sample: raceRows.slice(0, 5),
    ficheExample,
  });
}
