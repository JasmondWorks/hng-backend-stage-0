import { countriesList } from "./countries";

export const profileFiltersMap = [
  // Age fields
  { key: "young", value: { min_age: 16, max_age: 24 } },
  {
    key: "teenager",
    value: { min_age: 13, max_age: 19, age_group: "teenager" },
  },
  { key: "adult", value: { min_age: 18, age_group: "adult" } },
  { key: "child", value: { min_age: 1, max_age: 12, age_group: "child" } },
  { key: "baby", value: { min_age: 0, max_age: 2, age_group: "baby" } },
  { key: "senior", value: { min_age: 65, age_group: "senior" } },
  { key: "middle-aged", value: { min_age: 40, age_group: "middle-aged" } },

  //   Gender fields
  { key: "male", value: { gender: "male" } },
  { key: "female", value: { gender: "female" } },

  //   Country fields: {key: "nigeria", value: {country_id: "NG"}}
  ...getFormattedCountries(),
] as any[];

function getFormattedCountries() {
  return countriesList.map((country) => ({
    key: country.country_name.toLowerCase(),
    value: {
      country_id: country.country_code,
    },
  }));
}
