import {
  card,
  clamp,
  escapeXml,
  icons,
  kFormatter,
  RANK_CIRCUMFERENCE,
} from "../svg.js";
import { calculateRank } from "../rank.js";

const WIDTH = 495;
const ROW_HEIGHT = 25;
const VALUE_X = 220;

/** One "<icon> Label   Value" line, faded in slightly after the one above it. */
function statRow({ icon, label, value, index, showIcons }) {
  const y = index * ROW_HEIGHT;
  const delay = 450 + index * 150;
  const labelX = showIcons ? 25 : 0;

  return `<g class="stagger" style="animation-delay: ${delay}ms" transform="translate(25, ${y})">
      ${showIcons ? `<svg class="icon" x="0" y="0" viewBox="0 0 16 16" version="1.1" width="16" height="16">${icons[icon]}</svg>` : ""}
      <text class="stat bold" x="${labelX}" y="12.5">${escapeXml(label)}:</text>
      <text class="stat" x="${VALUE_X}" y="12.5">${kFormatter(value)}</text>
    </g>`;
}

/**
 * The rank ring: a dimmed full circle with a bright arc drawn over it.
 * The arc length is the dash offset, animated up from "empty".
 */
function rankCircle({ rank, x, y, theme, showPercentile }) {
  const filled = (100 - clamp(rank.percentile, 0, 100)) / 100;
  const offset = RANK_CIRCUMFERENCE * (1 - filled);

  return `<g data-testid="rank-circle" transform="translate(${x}, ${y})">
    <style>
      .rank-rim {
        stroke: ${theme.ring};
        fill: none;
        stroke-width: 6;
        opacity: 0.2;
      }
      .rank-arc {
        stroke: ${theme.ring};
        stroke-dasharray: ${RANK_CIRCUMFERENCE.toFixed(2)};
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
        opacity: 0.85;
        transform-origin: 0px 0px;
        transform: rotate(-90deg);
        animation: rankArc 1s forwards ease-in-out;
      }
      @keyframes rankArc {
        from { stroke-dashoffset: ${RANK_CIRCUMFERENCE.toFixed(2)}; }
        to { stroke-dashoffset: ${offset.toFixed(2)}; }
      }
      .rank-percentile {
        font: 600 11px 'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif;
        fill: ${theme.text};
        opacity: 0.75;
      }
      @media (prefers-reduced-motion: reduce) {
        .rank-arc { animation: none; stroke-dashoffset: ${offset.toFixed(2)}; }
      }
    </style>
    <circle class="rank-rim" cx="0" cy="0" r="40"/>
    <circle class="rank-arc" cx="0" cy="0" r="40" stroke-dashoffset="${offset.toFixed(2)}"/>
    <g class="rank-text">
      <text x="0" y="${showPercentile ? -8 : 0}" text-anchor="middle" dominant-baseline="central">${rank.level}</text>
    </g>
    ${showPercentile ? `<text x="0" y="20" text-anchor="middle" class="rank-percentile">Top ${rank.percentile.toFixed(1)}%</text>` : ""}
  </g>`;
}

export function renderStatsCard(stats, theme, options = {}) {
  const {
    title,
    showIcons = true,
    hideRank = false,
    hideBorder = false,
    hideTitle = false,
    includeAllCommits = true,
    showRankPercentile = false,
    hide = [],
  } = options;

  const hidden = new Set(hide.map((h) => h.toLowerCase()));
  const thisYear = new Date().getFullYear();

  const allRows = [
    { key: "stars", icon: "star", label: "Total Stars Earned", value: stats.stars },
    {
      key: "commits",
      icon: "commits",
      label: includeAllCommits
        ? "Total Commits"
        : `Total Commits (${thisYear})`,
      value: stats.commits,
    },
    { key: "prs", icon: "prs", label: "Total PRs", value: stats.prs },
    { key: "issues", icon: "issues", label: "Total Issues", value: stats.issues },
    {
      key: "contribs",
      icon: "contribs",
      label: "Contributed to (last year)",
      value: stats.contributions,
    },
  ].filter((row) => !hidden.has(row.key));

  const rows = allRows
    .map((row, index) => statRow({ ...row, index, showIcons }))
    .join("\n    ");

  // Enough room for every row, but never shorter than the rank ring needs.
  const height = Math.max(
    45 + (allRows.length + 1) * ROW_HEIGHT,
    hideRank ? 0 : 150,
  );
  const totalHeight = hideTitle ? height - 30 : height;

  const rank = calculateRank(stats);
  const overlay = hideRank
    ? ""
    : rankCircle({
        rank,
        x: WIDTH - 90,
        y: totalHeight / 2,
        theme,
        showPercentile: showRankPercentile,
      });

  return card({
    width: WIDTH,
    height,
    title: title ?? `${stats.name}'s GitHub Stats`,
    accessibleLabel: `${stats.name}'s GitHub stats: ${allRows
      .map((r) => `${r.label} ${r.value}`)
      .join(", ")}${hideRank ? "" : `, rank ${rank.level}`}`,
    theme,
    hideBorder,
    hideTitle,
    body: rows,
    overlay,
  });
}
