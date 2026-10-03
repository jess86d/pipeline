/**
 * Fuzzy string matching & token set ratio implementation
 * Exact replica of Python's rapidfuzz.fuzz / fuzzywuzzy.fuzz
 */

export interface TokenSetAnalysis {
  s1: string;
  s2: string;
  tokens1: string[];
  tokens2: string[];
  intersection: string[];
  diff1: string[];
  diff2: string[];
  t0: string; // intersection
  t1: string; // intersection + diff1
  t2: string; // intersection + diff2
  ratio01: number;
  ratio02: number;
  ratio12: number;
  score: number; // 0 to 100
}

export interface MatchScoringResult {
  customerName: string;
  propertyOwnerName: string;
  nameScore: number;
  nameAnalysis: TokenSetAnalysis;

  customerAddress: string;
  propertyAddress: string;
  addressScore: number;
  addressAnalysis: TokenSetAnalysis;

  customerZip: string;
  propertyZip: string;
  locationScore: number;
  locationMatchDetail: string;

  nameWeight: number;      // default 0.45
  addressWeight: number;   // default 0.35
  locationWeight: number;  // default 0.20

  compositeScore: number;  // 0 to 100
  confidence: 'High' | 'Medium' | 'Low';
  isMatch: boolean;
}

/**
 * Standard Levenshtein distance calculation
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * Similarity ratio matching difflib / Levenshtein ratio:
 * 2.0 * M / T where M is matching characters, T is total length.
 * Expressed as: (len(s1) + len(s2) - edit_distance_sub2) / (len(s1) + len(s2))
 */
export function similarityRatio(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 && len2 === 0) return 100;
  if (len1 === 0 || len2 === 0) return 0;
  if (s1 === s2) return 100;

  // Compute Levenshtein where substitution costs 2 (equivalent to 1 deletion + 1 insertion)
  const dp: number[][] = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // delete
          dp[i][j - 1] + 1,     // insert
          dp[i - 1][j - 1] + 2  // replace (cost 2)
        );
      }
    }
  }

  const dist = dp[len1][len2];
  const total = len1 + len2;
  const sim = (total - dist) / total;
  return Math.round(Math.max(0, Math.min(1, sim)) * 1000) / 10;
}

/**
 * Tokenize string by standardizing alphanumeric words
 */
export function tokenize(str: string): string[] {
  if (!str) return [];
  // Lowercase, replace punctuation with spaces, split by whitespace
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Python fuzz.token_set_ratio(s1, s2)
 * Token set ratio splits both strings into tokens, finds the intersection,
 * and compares intersection vs remaining tokens to handle duplicates, reordering, and extra words.
 */
export function tokenSetRatio(s1: string, s2: string): number {
  return analyzeTokenSetRatio(s1, s2).score;
}

/**
 * Detailed token set ratio with complete step breakdown
 */
export function analyzeTokenSetRatio(s1: string, s2: string): TokenSetAnalysis {
  const str1 = String(s1 ?? '').trim();
  const str2 = String(s2 ?? '').trim();

  if (!str1 && !str2) {
    return {
      s1: str1,
      s2: str2,
      tokens1: [],
      tokens2: [],
      intersection: [],
      diff1: [],
      diff2: [],
      t0: '',
      t1: '',
      t2: '',
      ratio01: 100,
      ratio02: 100,
      ratio12: 100,
      score: 100,
    };
  }

  if (!str1 || !str2) {
    return {
      s1: str1,
      s2: str2,
      tokens1: tokenize(str1),
      tokens2: tokenize(str2),
      intersection: [],
      diff1: tokenize(str1),
      diff2: tokenize(str2),
      t0: '',
      t1: '',
      t2: '',
      ratio01: 0,
      ratio02: 0,
      ratio12: 0,
      score: 0,
    };
  }

  const rawTokens1 = tokenize(str1);
  const rawTokens2 = tokenize(str2);

  const set1 = new Set(rawTokens1);
  const set2 = new Set(rawTokens2);

  const intersectionSet = new Set<string>();
  for (const t of set1) {
    if (set2.has(t)) {
      intersectionSet.add(t);
    }
  }

  const intersection = Array.from(intersectionSet).sort();
  const diff1 = Array.from(set1).filter((t) => !intersectionSet.has(t)).sort();
  const diff2 = Array.from(set2).filter((t) => !intersectionSet.has(t)).sort();

  const t0 = intersection.join(' ').trim();
  const t1 = [...intersection, ...diff1].join(' ').trim();
  const t2 = [...intersection, ...diff2].join(' ').trim();

  const ratio01 = t0 && t1 ? similarityRatio(t0, t1) : similarityRatio(t1, t2);
  const ratio02 = t0 && t2 ? similarityRatio(t0, t2) : similarityRatio(t1, t2);
  const ratio12 = similarityRatio(t1, t2);

  let score = Math.max(ratio01, ratio02, ratio12);
  if (isNaN(score)) score = 0;

  return {
    s1: str1,
    s2: str2,
    tokens1: Array.from(set1).sort(),
    tokens2: Array.from(set2).sort(),
    intersection,
    diff1,
    diff2,
    t0,
    t1,
    t2,
    ratio01,
    ratio02,
    ratio12,
    score: Math.round(score * 10) / 10,
  };
}

/**
 * Calculates location score based on ZIP code match
 */
export function calculateLocationScore(zip1: string, zip2: string): { score: number; detail: string } {
  const z1 = String(zip1 ?? '').replace(/\D/g, '').slice(0, 5);
  const z2 = String(zip2 ?? '').replace(/\D/g, '').slice(0, 5);

  if (!z1 || !z2) {
    return { score: 50, detail: 'Partial / Missing ZIP (Neutral Baseline: 50.0)' };
  }

  if (z1 === z2) {
    return { score: 100, detail: `Exact 5-digit ZIP Match (${z1} == ${z2})` };
  }

  if (z1.slice(0, 3) === z2.slice(0, 3)) {
    return { score: 70, detail: `Same Regional Sectional Center (${z1.slice(0, 3)}xx)` };
  }

  return { score: 0, detail: `Different Geographic Sectors (${z1} vs ${z2})` };
}

/**
 * Implements user's composite formula:
 * score = (
 *     name_score * 0.45 +
 *     address_score * 0.35 +
 *     location_score * 0.20
 * )
 */
export function calculateCompositeMatchScore(
  customer: { name: string; address: string; zip: string },
  property: { ownerName: string; address: string; zip: string },
  weights: { nameWeight?: number; addressWeight?: number; locationWeight?: number } = {}
): MatchScoringResult {
  const nameWeight = weights.nameWeight ?? 0.45;
  const addressWeight = weights.addressWeight ?? 0.35;
  const locationWeight = weights.locationWeight ?? 0.20;

  const nameAnalysis = analyzeTokenSetRatio(customer.name, property.ownerName);
  const addressAnalysis = analyzeTokenSetRatio(customer.address, property.address);
  const locationAnalysis = calculateLocationScore(customer.zip, property.zip);

  const nameScore = nameAnalysis.score;
  const addressScore = addressAnalysis.score;
  const locationScore = locationAnalysis.score;

  const composite = nameScore * nameWeight + addressScore * addressWeight + locationScore * locationWeight;
  const compositeScore = Math.round(composite * 10) / 10;

  let confidence: 'High' | 'Medium' | 'Low' = 'Low';
  if (compositeScore >= 80) confidence = 'High';
  else if (compositeScore >= 60) confidence = 'Medium';

  return {
    customerName: customer.name,
    propertyOwnerName: property.ownerName,
    nameScore,
    nameAnalysis,

    customerAddress: customer.address,
    propertyAddress: property.address,
    addressScore,
    addressAnalysis,

    customerZip: customer.zip,
    propertyZip: property.zip,
    locationScore,
    locationMatchDetail: locationAnalysis.detail,

    nameWeight,
    addressWeight,
    locationWeight,

    compositeScore,
    confidence,
    isMatch: compositeScore >= 75,
  };
}
