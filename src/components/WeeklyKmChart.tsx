"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Run {
  date: string;
  distanceKm: number;
}

interface WeekBucket {
  label: string;      // "S12" ou "Cette sem."
  km: number;
  isCurrent: boolean;
}

function getWeekStart(d: Date): number {
  const day = d.getDay();
  const ms = d.getTime() - (day === 0 ? 6 : day - 1) * 86400000;
  return new Date(ms).setHours(0, 0, 0, 0);
}

function weekLabel(weekStartMs: number, currentWeekMs: number): string {
  const diff = Math.round((currentWeekMs - weekStartMs) / (7 * 86400000));
  if (diff === 0) return "Cette sem.";
  if (diff === 1) return "Sem. -1";
  const d = new Date(weekStartMs);
  const week = Math.ceil((d.getDate() - (d.getDay() || 7) + 10) / 7);
  return `S${week}`;
}

function buildBuckets(runs: Run[], n = 10): WeekBucket[] {
  const now = new Date();
  const currentWeekMs = getWeekStart(now);

  // Aggregate km by week start
  const map = new Map<number, number>();
  for (const r of runs) {
    const ws = getWeekStart(new Date(r.date));
    map.set(ws, (map.get(ws) ?? 0) + r.distanceKm);
  }

  // Build last n weeks (oldest → newest)
  const buckets: WeekBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const ws = currentWeekMs - i * 7 * 86400000;
    buckets.push({
      label: weekLabel(ws, currentWeekMs),
      km: map.get(ws) ?? 0,
      isCurrent: ws === currentWeekMs,
    });
  }
  return buckets;
}

interface Props {
  runs: Run[];
  weeks?: number;
}

const VW = 320;
const VH = 130;
const PAD_LEFT = 32;
const PAD_RIGHT = 8;
const PAD_TOP = 10;
const PAD_BOT = 28;
const CHART_W = VW - PAD_LEFT - PAD_RIGHT;
const CHART_H = VH - PAD_TOP - PAD_BOT;

export function WeeklyKmChart({ runs, weeks = 10 }: Props) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const buckets = useMemo(() => buildBuckets(runs, weeks), [runs, weeks]);
  const maxKm = Math.max(...buckets.map((b) => b.km), 1);
  // Nice Y max: round up to next 5
  const yMax = Math.ceil(maxKm / 5) * 5;

  const barW = Math.floor(CHART_W / weeks) - 4;
  const gap = Math.floor(CHART_W / weeks);

  // Y grid lines at 0, yMax/2, yMax
  const gridVals = [0, Math.round(yMax / 2), yMax];

  const barX = (i: number) => PAD_LEFT + i * gap + (gap - barW) / 2;
  const barH = (km: number) => (km / yMax) * CHART_H;
  const barY = (km: number) => PAD_TOP + CHART_H - barH(km);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5d76e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="bar-grad-cur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5c0" stopOpacity="1" />
            <stop offset="100%" stopColor="#f5d76e" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridVals.map((v) => {
          const y = PAD_TOP + CHART_H - (v / yMax) * CHART_H;
          return (
            <g key={v}>
              <line
                x1={PAD_LEFT} y1={y} x2={VW - PAD_RIGHT} y2={y}
                stroke="#3d3020" strokeWidth={0.7} strokeDasharray={v === 0 ? "none" : "3 3"}
              />
              <text
                x={PAD_LEFT - 4} y={y + 3}
                textAnchor="end"
                fontSize={8}
                fill="#6b5c3e"
                fontFamily="'Inter', sans-serif"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {buckets.map((b, i) => {
          const x = barX(i);
          const h = animated ? barH(b.km) : 0;
          const y = PAD_TOP + CHART_H - h;
          const fill = b.isCurrent ? "url(#bar-grad-cur)" : "url(#bar-grad)";
          const opacity = b.km === 0 ? 0 : b.isCurrent ? 1 : 0.7;

          return (
            <g key={i}>
              {/* Empty bar ghost */}
              <rect
                x={x} y={PAD_TOP} width={barW} height={CHART_H}
                fill="rgba(201,162,39,0.04)"
              />
              {/* Filled bar */}
              <rect
                x={x} y={y} width={barW} height={h}
                fill={fill} opacity={opacity}
                style={{ transition: `height 0.6s ease-out ${i * 0.04}s, y 0.6s ease-out ${i * 0.04}s` }}
              />
              {/* Glow on current week */}
              {b.isCurrent && b.km > 0 && (
                <rect
                  x={x - 1} y={y - 1} width={barW + 2} height={h + 2}
                  fill="none" stroke="#f5d76e" strokeWidth={1} opacity={0.6}
                />
              )}
              {/* km label on top (only if > 0) */}
              {b.km > 0 && (
                <text
                  x={x + barW / 2} y={y - 3}
                  textAnchor="middle"
                  fontSize={7}
                  fill={b.isCurrent ? "#f5d76e" : "#c9a22799"}
                  fontFamily="'Cinzel', sans-serif"
                  fontWeight="700"
                >
                  {b.km.toFixed(1)}
                </text>
              )}
              {/* X label */}
              <text
                x={x + barW / 2}
                y={VH - 4}
                textAnchor="middle"
                fontSize={b.isCurrent ? 7.5 : 6.5}
                fill={b.isCurrent ? "#c9a227" : "#4a3d28"}
                fontFamily="'Inter', sans-serif"
                fontWeight={b.isCurrent ? "700" : "400"}
              >
                {b.isCurrent ? "↑" : b.label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD_LEFT} y1={PAD_TOP + CHART_H}
          x2={VW - PAD_RIGHT} y2={PAD_TOP + CHART_H}
          stroke="#3d3020" strokeWidth={1}
        />
      </svg>

      {/* Current week indicator */}
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>
          ↑ SEMAINE EN COURS
        </span>
      </div>
    </div>
  );
}
