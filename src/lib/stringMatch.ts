/**
 * Computes the Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1  // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Returns a similarity score between 0 and 1.
 * 1 means exact match, 0 means completely different.
 */
export function fuzzyMatchSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aClean = a.trim().toLowerCase();
  const bClean = b.trim().toLowerCase();
  
  if (aClean === bClean) return 1;
  
  const distance = levenshteinDistance(aClean, bClean);
  const maxLength = Math.max(aClean.length, bClean.length);
  
  if (maxLength === 0) return 1;
  return 1 - (distance / maxLength);
}
