import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const BASE = "https://www.courseapied.net";
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const url = `${BASE}/calendrier/${now.getFullYear()}/${month}`;

  let html = "";
  let fetchError = "";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OlympeBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    html = await res.text();
  } catch (e) {
    fetchError = String(e);
  }

  if (fetchError) return NextResponse.json({ error: fetchError, url });

  const $ = cheerio.load(html);

  // Collect all tag/class combos in the page to understand its structure
  const tagSummary: Record<string, number> = {};
  $("*").each((_, el) => {
    const tag = (el as { tagName?: string }).tagName ?? "unknown";
    const cls = $(el).attr("class") ?? "";
    const key = cls ? `${tag}.${cls.split(" ")[0]}` : tag;
    tagSummary[key] = (tagSummary[key] ?? 0) + 1;
  });

  // Try every possible table/list selector
  const selectors = [
    "tr", "table", ".course", ".event", "li", ".calendrier",
    "[class*='course']", "[class*='race']", "[class*='event']", "[class*='cal']",
  ];
  const selectorHits: Record<string, number> = {};
  for (const s of selectors) {
    selectorHits[s] = $(s).length;
  }

  // Return first 3000 chars of HTML for manual inspection
  const htmlPreview = html.slice(0, 3000);

  // Top 30 most frequent classes/tags
  const topTags = Object.entries(tagSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  return NextResponse.json({ url, htmlLength: html.length, htmlPreview, selectorHits, topTags });
}
