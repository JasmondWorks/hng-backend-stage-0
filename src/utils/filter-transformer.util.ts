// Converts the output of parseNaturalQuery() into a Prisma-compatible where-clause fragment.
//
// Mongoose note: this used to be called transformToMongoFilters. The output format
// is actually identical for both databases — Prisma uses { gte, lte } without the
// $ prefix that MongoDB uses, which is exactly what this function already produced.
// Only the name changed.

export function transformToFilters(filters: Record<string, any>) {
  const result: Record<string, any> = {};

  if (filters.gender) result.gender = filters.gender;
  if (filters.country_id) result.country_id = filters.country_id;
  if (filters.age_group) result.age_group = filters.age_group;

  if (filters.min_age || filters.max_age) {
    result.age = {};
    if (filters.min_age) result.age.gte = filters.min_age;
    if (filters.max_age) result.age.lte = filters.max_age;
  }

  return result;
}
