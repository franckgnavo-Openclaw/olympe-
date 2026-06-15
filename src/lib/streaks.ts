const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

function getWeekStart(d: Date): number {
  const w = new Date(d);
  const day = w.getDay();
  w.setDate(w.getDate() - (day === 0 ? 6 : day - 1));
  w.setHours(0, 0, 0, 0);
  return w.getTime();
}

/**
 * Computes current and longest weekly streaks from a list of run dates.
 * A streak = N consecutive calendar weeks (Mon–Sun) each containing at least one run.
 * The current streak is only alive if the most recent run week is this week or last week.
 */
export function computeStreaks(runDates: Date[]): { currentStreak: number; longestStreak: number } {
  if (runDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const weekSet = new Set(runDates.map(d => getWeekStart(d)));
  const weeks = Array.from(weekSet).sort((a, b) => a - b);

  // Walk forwards to find longest streak
  let longestStreak = 1;
  let cur = 1;
  for (let i = 1; i < weeks.length; i++) {
    if (weeks[i] - weeks[i - 1] === ONE_WEEK) {
      cur++;
      longestStreak = Math.max(longestStreak, cur);
    } else {
      cur = 1;
    }
  }

  // Current streak: walk backwards from the most recent week
  const thisWeekStart = getWeekStart(new Date());
  const lastRunWeek = weeks[weeks.length - 1];

  // Streak is dead if most recent run was more than one full week ago
  if (lastRunWeek < thisWeekStart - ONE_WEEK) {
    return { currentStreak: 0, longestStreak };
  }

  let currentStreak = 1;
  for (let i = weeks.length - 2; i >= 0; i--) {
    if (weeks[i + 1] - weeks[i] === ONE_WEEK) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}
