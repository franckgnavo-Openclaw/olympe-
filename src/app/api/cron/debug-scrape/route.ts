import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const url = "https://www.athle.fr/base/calendrier";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Sample first 5 table rows with their HTML
    const firstRows: string[] = [];
    $("tr").slice(0, 10).each((_i, el) => {
      firstRows.push($(el).text().replace(/\s+/g, " ").trim().slice(0, 200));
      return true;
    });

    // Look for links
    const firstLinks: string[] = [];
    $("a[href]").slice(0, 20).each((_i, el) => {
      firstLinks.push($(el).attr("href") ?? "");
      return true;
    });

    // Table headers
    const headers: string[] = [];
    $("th").slice(0, 20).each((_i, el) => {
      headers.push($(el).text().trim());
      return true;
    });

    // Sample specific td content
    const tdSamples: string[] = [];
    $("td").slice(0, 30).each((_i, el) => {
      const t = $(el).text().trim();
      if (t) tdSamples.push(t.slice(0, 80));
      return true;
    });

    return NextResponse.json({
      status: res.status,
      htmlLength: html.length,
      tables: $("table").length,
      rows: $("tr").length,
      headers,
      firstRows,
      tdSamples,
      firstLinks,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
