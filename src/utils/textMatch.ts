/** Normalizes free text for fuzzy comparison: lowercase, strip accents, collapse whitespace. */
export function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Simple, dependency-free similarity score in [0, 1] between two free-text labels:
 * exact match after normalization scores 1, substring containment scores high,
 * otherwise scored by the proportion of shared whitespace-separated tokens.
 */
export function similarityScore(a: string, b: string): number {
  const normA = normalizeLabel(a);
  const normB = normalizeLabel(b);

  if (!normA || !normB) {
    return 0;
  }

  if (normA === normB) {
    return 1;
  }

  if (normA.includes(normB) || normB.includes(normA)) {
    return 0.85;
  }

  const tokensA = new Set(normA.split(' ').filter(Boolean));
  const tokensB = new Set(normB.split(' ').filter(Boolean));
  const shared = [...tokensA].filter((token) => tokensB.has(token));

  if (shared.length === 0) {
    return 0;
  }

  const union = new Set([...tokensA, ...tokensB]);
  return shared.length / union.size;
}
