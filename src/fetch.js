/** Everything that talks to api.github.com lives here. */

const API = "https://api.github.com/graphql";

/**
 * Token resolution order. In CI, PERSONAL_TOKEN (a classic PAT with `repo`)
 * is what unlocks private contribution counts; the automatic GITHUB_TOKEN
 * can only ever see public activity.
 */
export function resolveToken(env = process.env) {
  const token =
    env.PERSONAL_TOKEN || env.GH_TOKEN || env.GITHUB_TOKEN || env.TOKEN;
  if (!token) {
    throw new Error(
      "No GitHub token found. Set PERSONAL_TOKEN (or GH_TOKEN) in the environment.",
    );
  }
  return token;
}

async function graphql(query, variables, token, attempt = 1) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-stats-cards",
    },
    body: JSON.stringify({ query, variables }),
  });

  // Abuse detection and 5xx are both worth one slow retry before giving up.
  if ((res.status === 403 || res.status >= 500) && attempt < 3) {
    const waitMs = 5000 * attempt;
    console.warn(`  GitHub returned ${res.status}, retrying in ${waitMs}ms...`);
    await new Promise((r) => setTimeout(r, waitMs));
    return graphql(query, variables, token, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(
      `GitHub API errors: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  return json.data;
}

const PROFILE_QUERY = `
query ($login: String!, $after: String) {
  user(login: $login) {
    name
    login
    followers { totalCount }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestReviewContributions
      contributionYears
    }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
      totalCount
    }
    pullRequests(first: 1) { totalCount }
    mergedPullRequests: pullRequests(states: MERGED) { totalCount }
    openIssues: issues(states: OPEN) { totalCount }
    closedIssues: issues(states: CLOSED) { totalCount }
    repositories(first: 100, after: $after, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        name
        isFork
        isPrivate
        stargazerCount
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node { name color }
          }
        }
      }
    }
  }
}`;

/**
 * Lifetime commit count.
 *
 * `contributionsCollection` only ever covers a one-year window, so all-time
 * totals mean one window per active year. They're aliased into a single
 * query to keep this to one round trip.
 */
async function fetchCommitsByYear(login, years, token, countPrivate) {
  if (!years.length) return 0;

  const fields = years
    .map(
      (year) =>
        `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
          totalCommitContributions
          restrictedContributionsCount
        }`,
    )
    .join("\n");

  const data = await graphql(
    `query ($login: String!) { user(login: $login) { ${fields} } }`,
    { login },
    token,
  );

  return years.reduce((total, year) => {
    const year_ = data.user[`y${year}`];
    return (
      total +
      year_.totalCommitContributions +
      (countPrivate ? year_.restrictedContributionsCount : 0)
    );
  }, 0);
}

/** Fetches every owned repo, following the 100-per-page cursor. */
async function fetchAllRepos(login, token) {
  const repos = [];
  let after = null;
  let totalCount = 0;
  let profile = null;

  do {
    const data = await graphql(PROFILE_QUERY, { login, after }, token);
    if (!data.user) throw new Error(`No such GitHub user: ${login}`);
    profile ??= data.user;
    totalCount = data.user.repositories.totalCount;
    repos.push(...data.user.repositories.nodes);
    after = data.user.repositories.pageInfo.hasNextPage
      ? data.user.repositories.pageInfo.endCursor
      : null;
  } while (after);

  return { profile, repos, totalCount };
}

/**
 * Aggregates language bytes across repos.
 *
 * Forks are excluded by default: their language bytes are somebody else's
 * code and would otherwise dominate the chart.
 */
export function aggregateLanguages(repos, options = {}) {
  const {
    excludeRepos = [],
    excludeLanguages = [],
    countForks = false,
  } = options;

  const excludedRepos = new Set(excludeRepos.map((r) => r.toLowerCase()));
  const excludedLangs = new Set(excludeLanguages.map((l) => l.toLowerCase()));
  const totals = new Map();

  for (const repo of repos) {
    if (!countForks && repo.isFork) continue;
    if (excludedRepos.has(repo.name.toLowerCase())) continue;

    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (excludedLangs.has(name.toLowerCase())) continue;
      const current = totals.get(name) ?? { name, color: edge.node.color, size: 0 };
      current.size += edge.size;
      totals.set(name, current);
    }
  }

  const languages = [...totals.values()].sort((a, b) => b.size - a.size);
  const totalSize = languages.reduce((sum, l) => sum + l.size, 0) || 1;

  return languages.map((l) => ({ ...l, share: (l.size / totalSize) * 100 }));
}

export async function fetchStats(login, { token, countPrivate = true, includeAllCommits = true } = {}) {
  const { profile, repos, totalCount } = await fetchAllRepos(login, token);
  const contributions = profile.contributionsCollection;

  const commits = includeAllCommits
    ? await fetchCommitsByYear(login, contributions.contributionYears, token, countPrivate)
    : contributions.totalCommitContributions +
      (countPrivate ? contributions.restrictedContributionsCount : 0);

  const stars = repos
    .filter((r) => !r.isFork)
    .reduce((sum, r) => sum + r.stargazerCount, 0);

  return {
    name: profile.name || profile.login,
    login: profile.login,
    generatedAt: new Date().toISOString(),
    commits,
    stars,
    followers: profile.followers.totalCount,
    prs: profile.pullRequests.totalCount,
    mergedPrs: profile.mergedPullRequests.totalCount,
    issues: profile.openIssues.totalCount + profile.closedIssues.totalCount,
    reviews: contributions.totalPullRequestReviewContributions,
    contributions: profile.repositoriesContributedTo.totalCount,
    repos: totalCount,
    rawRepos: repos,
  };
}
