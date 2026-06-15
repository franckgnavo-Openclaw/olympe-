import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET() {
  const url = "https://oleno.fr/course-a-pied/calendrier/juin-2026";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Try different selectors
    const courseLinks = $("a[href^='/courses/']").length;
    const allLinks = $("a[href*='course']").length;
    const cards = $(".card, .race, .event, article, .item").length;

    // Raw HTML of first 3000 chars after body
    const bodySnippet = html.slice(html.indexOf("<body"), html.indexOf("<body") + 3000);

    // First anchor with /courses/ in href
    let firstCourseHtml = "";
    $("a").each((_i, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("/courses/") && !firstCourseHtml) {
        firstCourseHtml = $.html(el).slice(0, 800);
      }
      return true;
    });

    // All hrefs containing "course"
    const courseHrefs: string[] = [];
    $("a[href]").each((_i, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.includes("course")) courseHrefs.push(href);
      return true;
    });

    // Get full HTML of first course card
    let fullCardHtml = "";
    $("a[href^='/courses/']").first().each((_i, el) => {
      fullCardHtml = $.html(el);
      return true;
    });

    // Simulate parseRaces logic on first card
    let parsedDebug: Record<string, unknown> = {};
    $("a[href^='/courses/']").first().each((_i, el) => {
      const name = $(el).find("h3").text().trim();
      const spans = $(el).find("span").map((_j, s) => $(s).text().trim()).get();
      const h3s = $(el).find("h3").map((_j, s) => $(s).text().trim()).get();
      const h2s = $(el).find("h2").map((_j, s) => $(s).text().trim()).get();
      const ps = $(el).find("p").map((_j, s) => $(s).text().trim()).get();
      parsedDebug = { name, spans, h3s, h2s, ps };
      return true;
    });

    return NextResponse.json({
      status: res.status,
      htmlLength: html.length,
      courseLinks,
      parsedDebug,
      fullCardHtml: fullCardHtml.slice(0, 3000),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
