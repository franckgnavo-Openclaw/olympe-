import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const badges = [
  // Distance cumulée
  { slug: "first-run",    name: "Premier Pas",       emoji: "👣", description: "Compléter son 1er run",            threshold: 1 },
  { slug: "5km-total",    name: "Marcheur",           emoji: "🚶", description: "5 km cumulés",                    threshold: 5 },
  { slug: "10km",         name: "Coureur",            emoji: "🏃", description: "10 km cumulés",                   threshold: 10 },
  { slug: "100km",        name: "Centurion",          emoji: "⚔️",  description: "100 km cumulés",                  threshold: 100 },
  { slug: "500km-total",  name: "Marathonien",        emoji: "🛡️",  description: "500 km cumulés",                 threshold: 500 },
  // Performance
  { slug: "personal-record", name: "Sang de Guerrier", emoji: "🩸", description: "Battre son record de distance",  threshold: 1 },
  { slug: "10km-single",  name: "Décathlonien",       emoji: "⚡", description: "10 km en une seule sortie",       threshold: 10 },
  { slug: "sub-6-pace",   name: "Foudre",             emoji: "💨", description: "Allure < 6 min/km",               threshold: 1 },
  { slug: "half-marathon",name: "Demi-Dieu",          emoji: "🌗", description: "21 km en une seule sortie",       threshold: 21 },
  { slug: "marathon",     name: "Olympien",           emoji: "🌕", description: "42 km en une seule sortie",       threshold: 42 },
  // Régularité
  { slug: "streak-2",     name: "Étincelle",          emoji: "✨", description: "2 semaines consécutives actives",  threshold: 2 },
  { slug: "streak-4",     name: "Flamme",             emoji: "🔥", description: "4 semaines consécutives",         threshold: 4 },
  { slug: "streak-7",     name: "Brasier",            emoji: "🌋", description: "7 semaines consécutives",         threshold: 7 },
  { slug: "week-3runs",   name: "Discipliné",         emoji: "📅", description: "3 runs en une semaine",           threshold: 3 },
  { slug: "week-5runs",   name: "Forgeron",           emoji: "🔨", description: "5 runs en une semaine",           threshold: 5 },
  { slug: "month-20runs", name: "Obsédé",             emoji: "💀", description: "20 runs en un mois",              threshold: 20 },
  // Moments
  { slug: "early-bird",   name: "Aube du Guerrier",   emoji: "🌅", description: "Enregistrer un run avant 8h",    threshold: 1 },
  { slug: "night-runner", name: "Ombre Nocturne",     emoji: "🌙", description: "Enregistrer un run après 21h",   threshold: 1 },
  // Points / Prestige
  { slug: "100-points",   name: "Aspirant",           emoji: "🥉", description: "100 pts de gloire",              threshold: 100 },
  { slug: "500-points",   name: "Vaillant",           emoji: "🥈", description: "500 pts de gloire",              threshold: 500 },
  { slug: "1000-points",  name: "Valeureux",          emoji: "🥇", description: "1 000 pts de gloire",            threshold: 1000 },
  { slug: "5000-points",  name: "Héros",              emoji: "👑", description: "5 000 pts de gloire",            threshold: 5000 },
  { slug: "level-5",      name: "Ascension",          emoji: "⭐", description: "Atteindre le niveau 5",                           threshold: 5 },
  // Programme 10km
  { slug: "program-first",    name: "Engagé",         emoji: "📋", description: "Valider sa 1ère séance du programme 10km",          threshold: 1 },
  { slug: "program-week1",    name: "Cap de la 1ère", emoji: "🗓️", description: "Terminer la semaine 1 du programme",               threshold: 1 },
  { slug: "program-10",       name: "Régiment",       emoji: "⚔️",  description: "10 séances du programme accomplies",               threshold: 10 },
  { slug: "program-halfway",  name: "Mi-Chemin",      emoji: "🌓", description: "28 séances du programme accomplies",                threshold: 28 },
  { slug: "program-complete", name: "Conquérant",     emoji: "🏆", description: "Programme 10km terminé en intégralité !",           threshold: 56 },
  // Distance cumulée (nouveaux)
  { slug: "25km-total",       name: "Éclaireur",             emoji: "🔭", description: "25 km cumulés",                threshold: 25 },
  { slug: "50km-total",       name: "Demi-Centurion",        emoji: "🗡️", description: "50 km cumulés",                threshold: 50 },
  { slug: "250km-total",      name: "Légionnaire",           emoji: "🛡️", description: "250 km cumulés",               threshold: 250 },
  { slug: "1000km-total",     name: "Légende des Terres",    emoji: "🌍", description: "1 000 km cumulés",             threshold: 1000 },
  // Distance sortie unique (nouveaux)
  { slug: "5km-single",       name: "Première Lame",         emoji: "🗡️", description: "5 km en une seule sortie",    threshold: 5 },
  { slug: "15km-single",      name: "Éclaireur Lointain",    emoji: "🏹", description: "15 km en une seule sortie",   threshold: 15 },
  { slug: "30km-single",      name: "Endurant",              emoji: "💪", description: "30 km en une seule sortie",   threshold: 30 },
  { slug: "ultra",            name: "Ultra-Guerrier",        emoji: "🌩️", description: "50 km en une seule sortie",   threshold: 50 },
  // Vitesse & Durée (nouveaux)
  { slug: "sub-5-pace",       name: "Tempête",               emoji: "🌪️", description: "Allure < 5 min/km",           threshold: 1 },
  { slug: "sub-4-pace",       name: "Foudre Divine",         emoji: "⚡", description: "Allure < 4 min/km",           threshold: 1 },
  { slug: "1h-run",           name: "Longue Marche",         emoji: "⏳", description: "Run ≥ 60 minutes",             threshold: 60 },
  { slug: "2h-run",           name: "Épopée",                emoji: "🏔️", description: "Run ≥ 120 minutes",            threshold: 120 },
  // Régularité (nouveaux)
  { slug: "10-runs",          name: "Habitué",               emoji: "📌", description: "10 runs au total",             threshold: 10 },
  { slug: "50-runs",          name: "Vétéran du Bitume",     emoji: "🎖️", description: "50 runs au total",             threshold: 50 },
  { slug: "100-runs",         name: "Centurion des Foulées", emoji: "🏅", description: "100 runs au total",            threshold: 100 },
  { slug: "streak-12",        name: "Inébranlable",          emoji: "🏛️", description: "12 semaines consécutives",     threshold: 12 },
  { slug: "month-10runs",     name: "Mois de Fer",           emoji: "🔩", description: "10 runs en un seul mois",      threshold: 10 },
  // Moments (nouveaux)
  { slug: "noon-runner",      name: "Soleil de Midi",        emoji: "☀️", description: "Run entre 12h et 14h",         threshold: 1 },
  { slug: "comeback",         name: "Le Revenant",           emoji: "👻", description: "Runner après 30 jours d'absence", threshold: 30 },
  // Prestige (nouveau)
  { slug: "10000-points",     name: "Transcendé",            emoji: "👁️", description: "10 000 pts de gloire",         threshold: 10000 },
];

async function main() {
  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: badge,
      create: badge,
    });
  }
  console.log(`✅ ${badges.length} badges seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
