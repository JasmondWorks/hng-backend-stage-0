import { ProfileFilters } from "../common/types/api-features.type";

export const buildFiltersFromNaturalLanguage = (
  q: string,
  filterMap: any[],
): ProfileFilters => {
  let filters: ProfileFilters = {};

  if (!q) return filters;

  for (const filter of filterMap) {
    if (q.includes(filter.key)) {
      filters = {
        ...filters,
        ...filter.value,
      };
    }
  }

  return filters;
};
