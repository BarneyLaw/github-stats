# github-stats

Self-hosted GitHub stats cards. A GitHub Action renders SVGs from the GitHub
API on a schedule and publishes them to GitHub Pages, so the images in your
profile README are plain static files instead of calls to a shared service that
can rate-limit or go down.

**Live cards:** https://barneylaw.github.io/github-stats/

<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://barneylaw.github.io/github-stats/stats-github_dark.svg" />
  <img src="https://barneylaw.github.io/github-stats/stats-graywhite.svg"
       alt="GitHub stats" />
</picture>

## Setup

1. **Enable Pages.** Repo *Settings → Pages → Build and deployment → Source:
   **GitHub Actions***. (Not "Deploy from a branch" — nothing is committed to a
   `gh-pages` branch.)
2. **Add a token** (optional, but needed for private contributions). Create a
   classic PAT with the `repo` scope, then add it under *Settings → Secrets and
   variables → Actions → New repository secret* named `PERSONAL_TOKEN`.
   Without it the workflow falls back to the automatic `GITHUB_TOKEN`, which
   only sees public activity.
3. **Run it.** Push to `main`, or trigger *Actions → Build and deploy stats
   cards → Run workflow*. After that it rebuilds every 6 hours.

## Using the cards

Put this in your profile README (`BarneyLaw/BarneyLaw`):

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://barneylaw.github.io/github-stats/stats-github_dark.svg" />
  <img src="https://barneylaw.github.io/github-stats/stats-graywhite.svg"
       alt="GitHub stats: commits, pull requests, and issues" />
</picture>
```

Every built card is listed with a copy button on the
[Pages site](https://barneylaw.github.io/github-stats/). The raw numbers are
published as [`data.json`](https://barneylaw.github.io/github-stats/data.json)
if you want to use them elsewhere.

> **Caching note:** GitHub proxies README images through its Camo cache, so a
> freshly rebuilt card can take a few minutes to show up on your profile.

## Configuration

Everything lives in [`config.json`](config.json):

| Key | What it does |
| --- | --- |
| `username` | Whose stats to fetch. |
| `themes` | Which themes to render. One SVG per card per theme. |
| `stats.includeAllCommits` | All-time commits (`true`) vs. the last year only. |
| `stats.countPrivate` | Include private contributions. Needs `PERSONAL_TOKEN`. |
| `stats.hideRank` | Drop the rank ring. |
| `stats.hideTitle` / `hideBorder` | Trim the card down for embedding. |
| `stats.hide` | Rows to omit: `stars`, `commits`, `prs`, `issues`, `contribs`. |
| `languages.count` | How many languages to show. |
| `languages.excludeRepos` / `excludeLanguages` | Skip noisy repos or languages. |
| `languages.countForks` | Count forked repos' languages (off by default). |

Available themes: `github_dark`, `github_light`, `graywhite`, `tokyonight`,
`catppuccin_mocha`, `dracula`, `radical`, `nord`, `transparent`. Add your own in
[`src/themes.js`](src/themes.js).

## Developing locally

```bash
node src/index.js --demo          # fake data, no token, no network
GH_TOKEN=$(gh auth token) node src/index.js   # real data
```

Output lands in `dist/`. Open `dist/index.html` to see every card at once.

## How it works

| File | Role |
| --- | --- |
| [`src/fetch.js`](src/fetch.js) | GraphQL queries, repo pagination, language aggregation. |
| [`src/rank.js`](src/rank.js) | S–C rank from the fetched stats. |
| [`src/cards/`](src/cards/) | One renderer per card, each returning an SVG string. |
| [`src/themes.js`](src/themes.js) | Colour palettes. |
| [`src/site.js`](src/site.js) | The Pages landing page. |

All-time commit totals need one `contributionsCollection` window per active
year, since that field only ever covers 12 months; they're aliased into a
single GraphQL request.

No dependencies — just Node 20+ and `fetch`.
