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

    return NextResponse.json({
      status: res.status,
      htmlLength: html.length,
      courseLinks,
      allLinks,
      cards,
      courseHrefs: courseHrefs.slice(0, 10),
      firstCourseHtml,
      bodySnippet,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
