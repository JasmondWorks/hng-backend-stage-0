export interface Profile {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  age: number;
  age_group: string;
  country_id: string;
  country_name: string;
  country_probability: number;
  created_at: Date;
}

export interface ProfileShortResponse {
  id: string;
  name: string;
  gender: string;
  age: number;
  age_group: string;
  country_id: string;
}
export interface ProfileResponse {
  id: string;
  name: string;
  gender: string;
  gender_probability: number;
  sample_size: number;
  age: number;
  age_group: string;
  country_id: string;
  country_probability: number;
  created_at: Date;
}

export interface GenderizeExternalApiResponse {
  name: string;
  gender: string | null;
  probability: number;
  count: number;
}

export interface AgifyExternalApiResponse {
  name: string;
  age: number | null;
  count: number;
}

export interface NationalizeExternalApiResponse {
  name: string;
  country: { country_id: string; probability: number }[];
}
