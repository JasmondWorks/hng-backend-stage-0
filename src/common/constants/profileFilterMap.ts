import { countriesList } from "./countries";

export const profileFiltersMap = [
  // Age groups (must match stored values: child, teenager, adult, senior)
  { key: "young", value: { min_age: 16, max_age: 24 } },
  { key: "teenager", value: { min_age: 13, max_age: 19, age_group: "teenager" } },
  { key: "teen", value: { min_age: 13, max_age: 19, age_group: "teenager" } },
  { key: "teens", value: { min_age: 13, max_age: 19, age_group: "teenager" } },
  { key: "teenagers", value: { min_age: 13, max_age: 19, age_group: "teenager" } },
  { key: "adult", value: { min_age: 20, age_group: "adult" } },
  { key: "adults", value: { min_age: 20, age_group: "adult" } },
  { key: "child", value: { min_age: 1, max_age: 12, age_group: "child" } },
  { key: "children", value: { min_age: 1, max_age: 12, age_group: "child" } },
  { key: "kids", value: { min_age: 1, max_age: 12, age_group: "child" } },
  { key: "senior", value: { min_age: 60, age_group: "senior" } },
  { key: "seniors", value: { min_age: 60, age_group: "senior" } },
  { key: "elderly", value: { min_age: 60, age_group: "senior" } },

  // Gender synonyms
  { key: "male", value: { gender: "male" } },
  { key: "males", value: { gender: "male" } },
  { key: "men", value: { gender: "male" } },
  { key: "man", value: { gender: "male" } },
  { key: "boy", value: { gender: "male" } },
  { key: "boys", value: { gender: "male" } },
  { key: "female", value: { gender: "female" } },
  { key: "females", value: { gender: "female" } },
  { key: "women", value: { gender: "female" } },
  { key: "woman", value: { gender: "female" } },
  { key: "girl", value: { gender: "female" } },
  { key: "girls", value: { gender: "female" } },

  // Country fields
  ...getFormattedCountries(),
] as any[];

function getFormattedCountries() {
  return countriesList.map((country) => ({
    key: country.country_name.toLowerCase(),
    value: { country_id: country.country_code },
  }));
}
