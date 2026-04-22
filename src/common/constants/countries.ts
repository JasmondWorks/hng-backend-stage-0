import { countries } from "countries-list";

export const countriesList = Object.entries(countries).map(([key, value]) => ({
  country_name: value.name,
  country_code: key,
}));
