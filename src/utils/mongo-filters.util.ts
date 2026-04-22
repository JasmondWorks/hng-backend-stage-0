export function buildMongoQuery(filters: any) {
  const query: any = {};

  // AGE handling
  if (filters.min_age !== undefined || filters.max_age !== undefined) {
    query.age = {};

    if (filters.min_age !== undefined) {
      query.age.$gte = filters.min_age;
    }

    if (filters.max_age !== undefined) {
      query.age.$lte = filters.max_age;
    }
  }

  // direct mappings
  if (filters.gender) {
    query.gender = filters.gender;
  }

  if (filters.country_id) {
    query.country_id = filters.country_id;
  }

  if (filters.age_group) {
    query.age_group = filters.age_group;
  }

  return query;
}
