import { QueryParams } from "../common/repositories/base.repository.interface";

const EXCLUDED_FIELDS = new Set(["page", "sort_by", "order", "limit", "fields", "q"]);

// Maps range URL params (e.g. min_age) to the corresponding DB field and operator.
// These are extracted separately so they produce nested range objects ({ gte, lte })
// rather than being passed as literal key=value equality filters.
const RANGE_PARAMS: Record<string, { field: string; op: "gte" | "lte" }> = {
  min_age: { field: "age", op: "gte" },
  max_age: { field: "age", op: "lte" },
  min_gender_probability: { field: "gender_probability", op: "gte" },
  min_country_probability: { field: "country_probability", op: "gte" },
  max_country_probability: { field: "country_probability", op: "lte" },
};

export function buildPrismaQuery(queryParams: QueryParams) {
  const where: Record<string, any> = {};

  // Range params → { field: { gte/lte: value } }
  for (const [param, { field, op }] of Object.entries(RANGE_PARAMS)) {
    if (queryParams[param] === undefined) continue;
    where[field] = where[field] ?? {};
    where[field][op] = field === "age"
      ? parseInt(queryParams[param] as string)
      : parseFloat(queryParams[param] as string);
  }

  // Direct equality filters and pre-built range objects (from the natural search path)
  for (const [key, value] of Object.entries(queryParams)) {
    if (EXCLUDED_FIELDS.has(key) || key in RANGE_PARAMS || value === undefined) continue;
    if (typeof value === "object" && value !== null) {
      // The natural language search path produces objects like { gte: 16, lte: 24 }.
      // Merge rather than overwrite so range params and search-path ranges coexist.
      where[key] = { ...(where[key] ?? {}), ...(value as object) };
    } else {
      where[key] = value;
    }
  }

  const sort_by = queryParams.sort_by as string | undefined;
  const orderBy = sort_by
    ? [{ [sort_by]: queryParams.order === "asc" ? "asc" : "desc" }]
    : [{ created_at: "desc" as const }];

  const page = parseInt(queryParams.page ?? "1") || 1;
  const limit = Math.min(parseInt(queryParams.limit ?? "10") || 10, 50);

  return { where, orderBy, skip: (page - 1) * limit, take: limit, page, limit };
}
