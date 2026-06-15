import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const url = "https://bases.athle.fr/asp.net/liste.aspx?frmpostback=true&frmbase=calendrier&frmmode=1&frmespace=0";

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36" },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Top classes
  const classCounts: Record<string, number> = {};
  $("[class]").each((_i, el) => {
    const classes = ($(el).attr("class") ?? "").split(/\s+/).filter(Boolean);
    for (const c of classes) classCounts[c] = (classCounts[c] ?? 0) + 1;
    return true;
  });
  const topClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Selector hits
  const selectors = ["tr", "table", "li", "a", ".datas0", ".datas1", ".datas",
    "[class*='data']", "[class*='line']", "[class*='row']", "[class*='event']",
    "[class*='course']", "[class*='cal']", "[class*='result']"];
  const hits: Record<string, number> = {};
  for (const s of selectors) hits[s] = $(s).length;

  // Sample first 10 <a> hrefs + text
  const links: string[] = [];
  $("a[href]").slice(0, 20).each((_i, el) => {
    links.push(`${$(el).text().trim().slice(0, 80)} → ${$(el).attr("href")}`);
    return true;
  });

  // Sample first 10 <tr> text content
  const rows: string[] = [];
  $("tr").slice(0, 10).each((_i, el) => {
    rows.push($(el).text().replace(/\s+/g, " ").trim().slice(0, 200));
    return true;
  });

  // HTML sections: header, middle, end
  const htmlEnd = html.slice(-3000);

  return NextResponse.json({ status: res.status, htmlLength: html.length, hits, topClasses, links, rows, htmlEnd });
}
