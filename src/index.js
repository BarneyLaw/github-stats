#!/usr/bin/env node
/**
 * Builds every configured card, for every configured theme, into dist/.
 *
 * Run locally with a token in the environment, or let the GitHub Action in
 * .github/workflows/build.yml run it on a schedule and publish dist/ to Pages.
 *
 *   node src/index.js            # real data (needs PERSONAL_TOKEN / GH_TOKEN)
 *   node src/index.js --demo     # fake data, no network, for tweaking layout
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { aggregateLanguages, fetchStats, resolveToken } from "./fetch.js";
import { getTheme } from "./themes.js";
import { renderStatsCard } from "./cards/stats.js";
import { renderLanguagesCard } from "./cards/languages.js";
import { renderSite } from "./site.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const DEMO_STATS = {
  name: "Octocat",
  login: "octocat",
  generatedAt: new Date().toISOString(),
  commits: 1287,
  stars: 342,
  followers: 91,
  prs: 76,
  mergedPrs: 61,
  issues: 44,
  reviews: 23,
  contributions: 12,
  repos: 28,
};

const DEMO_LANGUAGES = [
  { name: "TypeScript", color: "#3178c6", share: 34.2 },
  { name: "Python", color: "#3572A5", share: 24.8 },
  { name: "Rust", color: "#dea584", share: 15.1 },
  { name: "Go", color: "#00ADD8", share: 11.4 },
  { name: "C++", color: "#f34b7d", share: 8.9 },
  { name: "Shell", color: "#89e051", share: 5.6 },
];

async function loadConfig() {
  const raw = await readFile(join(ROOT, "config.json"), "utf8");
  const config = JSON.parse(raw);
  // The workflow can retarget the build without editing the file.
  if (process.env.GH_USERNAME) config.username = process.env.GH_USERNAME;
  return config;
}

async function main() {
  const demo = process.argv.includes("--demo");
  const config = await loadConfig();

  let stats;
  let languages;

  if (demo) {
    console.log("Running in --demo mode (no API calls).");
    stats = { ...DEMO_STATS, generatedAt: new Date().toISOString() };
    languages = DEMO_LANGUAGES;
  } else {
    const token = resolveToken();
    console.log(`Fetching stats for @${config.username}...`);
    stats = await fetchStats(config.username, {
      token,
      countPrivate: config.stats?.countPrivate ?? true,
      includeAllCommits: config.stats?.includeAllCommits ?? true,
    });
    languages = aggregateLanguages(stats.rawRepos, config.languages ?? {});
    delete stats.rawRepos;
    console.log(
      `  ${stats.commits} commits, ${stats.stars} stars, ${stats.prs} PRs, ` +
        `${stats.issues} issues across ${stats.repos} repos`,
    );
  }

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const written = [];

  for (const themeName of config.themes) {
    const theme = getTheme(themeName);

    if (config.stats?.enabled !== false) {
      const svg = renderStatsCard(stats, theme, config.stats ?? {});
      const file = `stats-${themeName}.svg`;
      await writeFile(join(DIST, file), svg, "utf8");
      written.push({ file, kind: "stats", theme: themeName });
    }

    if (config.languages?.enabled !== false) {
      const svg = renderLanguagesCard(languages, theme, config.languages ?? {});
      const file = `languages-${themeName}.svg`;
      await writeFile(join(DIST, file), svg, "utf8");
      written.push({ file, kind: "languages", theme: themeName });
    }
  }

  // Published alongside the cards so the numbers are reusable elsewhere.
  await writeFile(
    join(DIST, "data.json"),
    JSON.stringify({ ...stats, languages }, null, 2),
    "utf8",
  );

  // Pages needs this or it runs the output through Jekyll and drops files.
  await writeFile(join(DIST, ".nojekyll"), "", "utf8");

  await writeFile(
    join(DIST, "index.html"),
    renderSite({ stats, written, config }),
    "utf8",
  );

  console.log(`Wrote ${written.length} cards + index.html to dist/`);
}

main().catch((error) => {
  console.error(`\nBuild failed: ${error.message}`);
  process.exit(1);
});
