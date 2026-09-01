/**
 * Percentile-style rank, S down to C.
 *
 * Each signal is pushed through a CDF so it saturates instead of growing
 * without bound - one viral repo with 40k stars shouldn't drown out every
 * other number on the card. Commits/issues/reviews use an exponential CDF
 * (they accumulate steadily); stars/PRs/followers use a log-normal-ish CDF
 * (they're heavy tailed). The weighted mean is a percentile: lower is better.
 *
 * Medians and weights follow the same model github-readme-stats uses, so a
 * rank here means roughly what it meant on the card this replaces.
 */

const SIGNALS = [
  { key: "commits", median: 1000, weight: 2, cdf: exponentialCdf },
  { key: "contributions", median: 25, weight: 1, cdf: exponentialCdf },
  { key: "issues", median: 25, weight: 1, cdf: exponentialCdf },
  { key: "reviews", median: 2, weight: 1, cdf: exponentialCdf },
  { key: "stars", median: 50, weight: 4, cdf: logNormalCdf },
  { key: "prs", median: 50, weight: 3, cdf: logNormalCdf },
  { key: "followers", median: 10, weight: 1, cdf: logNormalCdf },
];

const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
const LEVELS = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

function exponentialCdf(x) {
  return 1 - 2 ** -x;
}

function logNormalCdf(x) {
  return x / (1 + x);
}

export function calculateRank(stats) {
  const totalWeight = SIGNALS.reduce((sum, s) => sum + s.weight, 0);

  const score = SIGNALS.reduce(
    (sum, s) => sum + s.weight * s.cdf((stats[s.key] ?? 0) / s.median),
    0,
  );

  // Invert: a high score is a good profile, but rank is a percentile where
  // "top 1%" is the best possible outcome.
  const percentile = 100 * (1 - score / totalWeight);
  const level = LEVELS[THRESHOLDS.findIndex((t) => percentile <= t)] ?? "C";

  return { level, percentile };
}
