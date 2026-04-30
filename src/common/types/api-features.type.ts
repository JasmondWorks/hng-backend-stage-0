export type AgeGroup =
  | "baby"
  | "child"
  | "teenager"
  | "adult"
  | "middle-aged"
  | "senior";

export interface ProfileFilters {
  min_age?: number;
  max_age?: number;
  gender?: "male" | "female";
  country_id?: string;
  age_group?: AgeGroup;
}
