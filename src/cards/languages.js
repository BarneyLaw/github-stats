import { card, escapeXml } from "../svg.js";

const WIDTH = 420;
const BAR_X = 25;
const BAR_WIDTH = WIDTH - BAR_X * 2;
const BAR_HEIGHT = 8;
const LEGEND_ROW_HEIGHT = 22;
const COLUMN_X = [25, 25 + BAR_WIDTH / 2];
const COLUMN_WIDTH = BAR_WIDTH / 2;
const NAME_X = 18;
const PERCENT_RIGHT = COLUMN_WIDTH - 14;
/** Widest a name may be before it gets an ellipsis, leaving room for "100.0%". */
const MAX_NAME_WIDTH = PERCENT_RIGHT - 50 - NAME_X;
/** Written as a numeric entity so the glyph survives any encoding guess. */
const ELLIPSIS = "&#8230;";
const ELLIPSIS_WIDTH = 10;

/**
 * Rough advance width for 14px semibold Segoe UI. SVG has no way to measure
 * text at build time, so names are trimmed against an estimate - caps and
 * digits are wide, `i`/`l`/`.` are narrow, everything else sits in between.
 */
function estimateWidth(text) {
  let width = 0;
  for (const char of text) {
    if (/[A-Z0-9#+@%]/.test(char)) width += 9.1;
    else if (/[iljt.,'!|]/.test(char)) width += 3.9;
    else if (/[mwMW]/.test(char)) width += 12;
    else if (char === " ") width += 4;
    else width += 7.6;
  }
  return width;
}

/**
 * Keeps "Jupyter Notebook" from running into the percentage beside it.
 * Returns XML-escaped markup, because the ellipsis is an entity.
 */
function truncatedLabel(name) {
  if (estimateWidth(name) <= MAX_NAME_WIDTH) return escapeXml(name);

  let trimmed = name;
  while (
    trimmed.length > 1 &&
    estimateWidth(trimmed) + ELLIPSIS_WIDTH > MAX_NAME_WIDTH
  ) {
    trimmed = trimmed.slice(0, -1);
  }
  return escapeXml(trimmed.trimEnd()) + ELLIPSIS;
}

/** GitHub leaves `color` null for a few languages; keep the bar readable anyway. */
const FALLBACK_COLORS = ["#858585", "#a0a0a0", "#6e7781", "#57606a"];

export function renderLanguagesCard(languages, theme, options = {}) {
  const {
    title = "Most Used Languages",
    count = 6,
    hideBorder = false,
    hideTitle = false,
  } = options;

  const top = languages.slice(0, count);

  if (!top.length) {
    return card({
      width: WIDTH,
      height: 120,
      title,
      theme,
      hideBorder,
      hideTitle,
      body: `<text class="stat" x="25" y="12.5">No language data available.</text>`,
    });
  }

  // Re-normalise across the shown languages so the bar always fills the track.
  const shownTotal = top.reduce((sum, l) => sum + l.share, 0) || 1;
  const withShare = top.map((l, i) => ({
    ...l,
    color: l.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    percent: (l.share / shownTotal) * 100,
  }));

  let offset = 0;
  const segments = withShare
    .map((lang) => {
      const width = (lang.percent / 100) * BAR_WIDTH;
      const rect = `<rect mask="url(#bar-mask)" x="${(BAR_X + offset).toFixed(2)}" y="0" width="${width.toFixed(2)}" height="${BAR_HEIGHT}" fill="${lang.color}"/>`;
      offset += width;
      return rect;
    })
    .join("\n      ");

  const legendTop = 26;
  const legend = withShare
    .map((lang, i) => {
      const x = COLUMN_X[i % 2];
      const y = legendTop + Math.floor(i / 2) * LEGEND_ROW_HEIGHT;
      const delay = 450 + i * 150;
      return `<g class="stagger" style="animation-delay: ${delay}ms" transform="translate(${x}, ${y})">
        <circle cx="5" cy="6" r="5" fill="${lang.color}"/>
        <text class="stat" x="${NAME_X}" y="11">${truncatedLabel(lang.name)}</text>
        <text class="stat not-bold" x="${PERCENT_RIGHT}" y="11" text-anchor="end">${lang.percent.toFixed(1)}%</text>
      </g>`;
    })
    .join("\n    ");

  const legendRows = Math.ceil(withShare.length / 2);
  const contentHeight = legendTop + legendRows * LEGEND_ROW_HEIGHT;
  const height = 55 + contentHeight + 10;

  const body = `<mask id="bar-mask">
      <rect x="${BAR_X}" y="0" width="${BAR_WIDTH}" height="${BAR_HEIGHT}" fill="white" rx="4"/>
    </mask>
    <g class="lang-bar">
      ${segments}
    </g>
    ${legend}`;

  return card({
    width: WIDTH,
    height,
    title,
    accessibleLabel: `${title}: ${withShare
      .map((l) => `${l.name} ${l.percent.toFixed(1)}%`)
      .join(", ")}`,
    theme,
    hideBorder,
    hideTitle,
    body,
  });
}
