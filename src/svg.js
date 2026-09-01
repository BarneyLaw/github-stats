/** Small helpers shared by every card renderer. */

/** Radius 40 circle: 2 * PI * 40, rounded the way the arc maths expects. */
export const RANK_CIRCUMFERENCE = 2 * Math.PI * 40;

const FONT_STACK =
  "'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif";

/** SVGs are XML: anything user-controlled has to be escaped. */
export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 1234 -> 1.2k, so long numbers never overflow the value column. */
export function kFormatter(n) {
  if (Math.abs(n) < 1000) return String(n);
  const value = n / 1000;
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}k`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Octicons, 16x16 viewBox, matching the icons GitHub uses for each concept. */
export const icons = {
  star:
    '<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.719-4.194L.855 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"/>',
  commits:
    '<path d="M10.5 7.75a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm1.43.75a4.002 4.002 0 01-7.86 0H.75a.75.75 0 110-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 110 1.5h-3.32z"/>',
  prs:
    '<path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>',
  issues:
    '<path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/>',
  contribs:
    '<path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>',
  reviews:
    '<path d="M1.5 3.25a.75.75 0 011.5 0v9.5a.75.75 0 01-1.5 0v-9.5zM5 4.25A.75.75 0 015.75 3.5h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 4.25zm0 3.75A.75.75 0 015.75 7.25h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 8zm0 3.75a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z"/>',
};

/**
 * Wraps card content in the outer <svg>, background and optional title.
 *
 * `body` is rendered inside a group translated below the title, so each card
 * can lay itself out from (0, 0) without knowing whether a title is showing.
 */
export function card({
  width,
  height,
  title,
  theme,
  hideBorder = false,
  hideTitle = false,
  body,
  bodyY,
  overlay = "",
  accessibleLabel,
}) {
  const totalHeight = hideTitle ? height - 30 : height;
  const contentY = bodyY ?? (hideTitle ? 25 : 55);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="descId">
  <title id="descId">${escapeXml(accessibleLabel ?? title)}</title>
  <style>
    .header {
      font: 600 18px ${FONT_STACK};
      fill: ${theme.title};
      animation: fadeIn 0.8s ease-in-out forwards;
    }
    .stat {
      font: 600 14px ${FONT_STACK};
      fill: ${theme.text};
    }
    .stagger {
      opacity: 0;
      animation: fadeIn 0.3s ease-in-out forwards;
    }
    .icon { fill: ${theme.icon}; display: block; }
    .rank-text {
      font: 800 24px ${FONT_STACK};
      fill: ${theme.text};
      animation: scaleInAnimation 0.3s ease-in-out forwards;
    }
    .rank-percentile-header { font: 600 14px ${FONT_STACK}; fill: ${theme.text}; }
    .rank-percentile-text { font: 800 16px ${FONT_STACK}; fill: ${theme.text}; }
    .not-bold { font-weight: 400; }
    .bold { font-weight: 700; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleInAnimation {
      from { transform: translate(-5px, 5px) scale(0); }
      to { transform: translate(-5px, 5px) scale(1); }
    }
    @keyframes growWidthAnimation { from { width: 0; } to { width: 100%; } }
    @media (prefers-reduced-motion: reduce) {
      .header, .stagger, .rank-text, .rank-circle { animation: none; opacity: 1; }
    }
  </style>

  <rect data-testid="card-bg" x="0.5" y="0.5" rx="4.5"
        height="${totalHeight - 1}" width="${width - 1}"
        fill="${theme.bg}" stroke="${theme.border}"
        stroke-opacity="${hideBorder ? 0 : 1}" stroke-width="1"/>

  ${hideTitle ? "" : `<g data-testid="card-title" transform="translate(25, 35)">
    <text x="0" y="0" class="header">${escapeXml(title)}</text>
  </g>`}

  <g data-testid="main-card-body" transform="translate(0, ${contentY})">
    ${body}
  </g>

  ${overlay}
</svg>
`;
}
