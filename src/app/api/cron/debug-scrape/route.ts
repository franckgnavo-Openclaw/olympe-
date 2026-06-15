import { NextResponse } from "next/server";

export async function GET() {
  const candidates = [
    "https://www.courseapied.net/courses/",
    "https://www.courseapied.net/calendrier/",
    "https://www.courseapied.net/agenda/",
    "https://www.courseapied.net/",
    "https://www.runagain.fr/calendrier-courses-a-pied",
    "https://www.sport-actif.com/calendrier-course-a-pied/",
    "https://www.agenda-rando.com/calendrier-course-pied.php",
    "https://www.klikego.com/resultats/calendrier/1",
  ];

  const results: Record<string, { status: number; htmlLength: number; preview: string }> = {};

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36" },
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      results[url] = { status: res.status, htmlLength: text.length, preview: text.slice(0, 300) };
    } catch (e) {
      results[url] = { status: 0, htmlLength: 0, preview: String(e) };
    }
  }

  return NextResponse.json(results);
}
