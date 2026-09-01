/**
 * Colour palettes for the cards.
 *
 * Each theme defines:
 *   title  - card heading + rank letter
 *   icon   - stat row icons + language dots fallback
 *   text   - stat labels and values
 *   bg     - card background (may be `none`/transparent)
 *   border - card border stroke
 *   ring   - rank progress arc (defaults to `title`)
 *
 * Names are kept compatible with github-readme-stats so existing README
 * snippets keep meaning something after the swap.
 */
export const themes = {
  github_dark: {
    title: "#58a6ff",
    icon: "#58a6ff",
    text: "#c9d1d9",
    bg: "#0d1117",
    border: "#30363d",
  },
  github_light: {
    title: "#0969da",
    icon: "#0969da",
    text: "#1f2328",
    bg: "#ffffff",
    border: "#d0d7de",
  },
  graywhite: {
    title: "#24292e",
    icon: "#586069",
    text: "#24292e",
    bg: "#ffffff",
    border: "#e4e2e2",
  },
  tokyonight: {
    title: "#70a5fd",
    icon: "#bf91f3",
    text: "#38bdae",
    bg: "#1a1b27",
    border: "#2a2b3d",
  },
  catppuccin_mocha: {
    title: "#cba6f7",
    icon: "#f5c2e7",
    text: "#cdd6f4",
    bg: "#1e1e2e",
    border: "#313244",
  },
  dracula: {
    title: "#ff6e96",
    icon: "#79dafa",
    text: "#f8f8f2",
    bg: "#282a36",
    border: "#44475a",
  },
  radical: {
    title: "#fe428e",
    icon: "#f8d847",
    text: "#a9fef7",
    bg: "#141321",
    border: "#2d2b45",
  },
  nord: {
    title: "#81a1c1",
    icon: "#88c0d0",
    text: "#d8dee9",
    bg: "#2e3440",
    border: "#3b4252",
  },
  /** Inherits the surrounding page background; good for README embeds. */
  transparent: {
    title: "#58a6ff",
    icon: "#58a6ff",
    text: "#8b949e",
    bg: "none",
    border: "#8b949e",
  },
};

export function getTheme(name) {
  const theme = themes[name];
  if (!theme) {
    throw new Error(
      `Unknown theme "${name}". Available: ${Object.keys(themes).join(", ")}`,
    );
  }
  return { ring: theme.title, ...theme };
}
