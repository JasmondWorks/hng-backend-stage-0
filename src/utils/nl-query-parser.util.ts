import { profileFiltersMap } from "../common/constants/profileFilterMap";

export function parseNaturalQuery(query: string) {
  if (!query) return null;

  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/);
  const filters: Record<string, any> = {};
  let matched = false;

  // 1. Match single-word keywords from the filter map
  for (const token of tokens) {
    const found = profileFiltersMap.find((f) => f.key === token);
    if (found) {
      Object.assign(filters, found.value);
      matched = true;
    }
  }

  // 2. Handle "above X" / "over X" / "older than X" → min_age
  const minAgeMatch = normalized.match(/(?:above|over|older than)\s+(\d+)/);
  if (minAgeMatch) {
    filters.min_age = parseInt(minAgeMatch[1] as string);
    matched = true;
  }

  // 3. Handle "below X" / "under X" / "younger than X" → max_age
  const maxAgeMatch = normalized.match(/(?:below|under|younger than)\s+(\d+)/);
  if (maxAgeMatch) {
    filters.max_age = parseInt(maxAgeMatch[1] as string);
    matched = true;
  }

  // 4. Handle "aged X" / "age X" → exact age range
  const agedMatch = normalized.match(/\bage[d]?\s+(\d+)\b/);
  if (agedMatch) {
    filters.min_age = parseInt(agedMatch[1] as string);
    filters.max_age = parseInt(agedMatch[1] as string);
    matched = true;
  }

  // 5. Handle "from <country>" — supports multi-word country names
  const fromIdx = normalized.indexOf("from ");
  if (fromIdx !== -1) {
    const afterFrom = normalized.slice(fromIdx + 5).trim();
    const words = afterFrom.split(/\s+/);
    // Try progressively shorter phrases (up to 3 words) to match multi-word countries
    for (let len = Math.min(words.length, 3); len >= 1; len--) {
      const phrase = words.slice(0, len).join(" ");
      const found = profileFiltersMap.find(
        (f) => f.key === phrase && "country_id" in f.value,
      );
      if (found) {
        Object.assign(filters, found.value);
        matched = true;
        break;
      }
    }
  }

  return matched ? filters : null;
}
