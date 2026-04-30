export class CreateProfileDTO {
  name!: string;
  gender!: string | null;
  gender_probability!: number;
  age!: number;
  age_group!: string;
  country_id!: string;
  country_name!: string;
  country_probability!: number;
}

export class UpdateProfileDTO {
  gender!: string | null;
  probability!: number;
  sampleSize!: number;
  isConfident!: boolean;
}

export class ProfileDTO {
  name!: string;
}
