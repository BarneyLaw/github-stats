/**
 * The landing page published at the root of the Pages site.
 *
 * It exists so the deployment is self-documenting: open the URL, see every
 * card that was built, and copy the README snippet for the one you want.
 */

function baseUrl(config) {
  if (process.env.SITE_BASE_URL) return process.env.SITE_BASE_URL.replace(/\/$/, "");

  // In Actions this is "owner/repo"; locally fall back to the configured user.
  const slug = process.env.GITHUB_REPOSITORY;
  if (slug) {
    const [owner, repo] = slug.split("/");
    return `https://${owner.toLowerCase()}.github.io/${repo}`;
  }
  return `https://${config.username.toLowerCase()}.github.io/github-stats`;
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function renderSite({ stats, written, config }) {
  const base = baseUrl(config);
  const kinds = [...new Set(written.map((w) => w.kind))];

  const sections = kinds
    .map((kind) => {
      const cards = written.filter((w) => w.kind === kind);
      const items = cards
        .map((c) => {
          const url = `${base}/${c.file}`;
          const snippet = `<img src="${url}" alt="${kind}" />`;
          return `<figure class="card">
        <img src="${c.file}" alt="${kind} card, ${c.theme} theme" loading="lazy" />
        <figcaption>
          <code class="theme">${c.theme}</code>
          <button class="copy" data-snippet="${escapeHtml(snippet)}">copy embed</button>
        </figcaption>
      </figure>`;
        })
        .join("\n      ");

      return `<section>
      <h2>${kind === "stats" ? "Stats" : "Top languages"}</h2>
      <div class="grid">
      ${items}
      </div>
    </section>`;
    })
    .join("\n");

  const dark = written.find((w) => w.kind === "stats" && /dark|night|mocha|dracula|radical|nord/.test(w.theme));
  const light = written.find((w) => w.kind === "stats" && /light|graywhite/.test(w.theme));

  const readmeSnippet = `<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="${base}/${dark?.file ?? "stats-github_dark.svg"}" />
  <img src="${base}/${light?.file ?? "stats-graywhite.svg"}"
       alt="GitHub stats" />
</picture>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(stats.name)} · GitHub stats cards</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --panel: #f6f8fa;
    --text: #1f2328;
    --muted: #59636e;
    --border: #d1d9e0;
    --accent: #0969da;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0d1117;
      --panel: #161b22;
      --text: #e6edf3;
      --muted: #9198a1;
      --border: #30363d;
      --accent: #58a6ff;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 48px 24px 80px;
    background: var(--bg);
    color: var(--text);
    font: 16px/1.6 -apple-system, "Segoe UI", Ubuntu, sans-serif;
  }
  main { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  h2 { font-size: 18px; margin: 40px 0 14px; }
  .sub { color: var(--muted); margin: 0 0 8px; }
  .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  .card {
    margin: 0;
    padding: 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  .card img { display: block; width: 100%; height: auto; }
  figcaption {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; margin-top: 12px;
  }
  code, pre { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
  .theme { font-size: 13px; color: var(--muted); }
  button.copy {
    font: inherit; font-size: 13px; cursor: pointer;
    padding: 3px 10px; border-radius: 6px;
    border: 1px solid var(--border); background: var(--bg); color: var(--text);
  }
  button.copy:hover { border-color: var(--accent); color: var(--accent); }
  pre {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px; overflow-x: auto; font-size: 13px;
  }
  footer { margin-top: 48px; color: var(--muted); font-size: 13px; }
  a { color: var(--accent); }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(stats.name)}'s GitHub stats cards</h1>
  <p class="sub">
    Static SVGs, rebuilt on a schedule by GitHub Actions and served from GitHub Pages.
    Last generated <time datetime="${stats.generatedAt}">${stats.generatedAt.replace("T", " ").slice(0, 16)} UTC</time>.
  </p>

  <h2>Drop this in your profile README</h2>
  <pre><code>${escapeHtml(readmeSnippet)}</code></pre>

${sections}

  <footer>
    Raw numbers: <a href="data.json">data.json</a>
  </footer>
</main>
<script>
  document.querySelectorAll("button.copy").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(button.dataset.snippet);
      const original = button.textContent;
      button.textContent = "copied";
      setTimeout(() => { button.textContent = original; }, 1200);
    });
  });
</script>
</body>
</html>
`;
}
