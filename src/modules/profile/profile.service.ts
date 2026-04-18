import { AppError } from "../../utils/app-error.util";
import { CreateProfileDTO, ProfileDTO } from "./profile.dtos";
import { ProfileRepository } from "./profile.repository";
import {
  AgifyExternalApiResponse,
  GenderizeExternalApiResponse,
  NationalizeExternalApiResponse,
  Profile,
} from "./profile.types";

type ExternalApiName = "Genderize" | "Agify" | "Nationalize";

export class ProfileService {
  constructor(
    private readonly genderizeApiUrl: string,
    private readonly agifyApiUrl: string,
    private readonly nationalizeApiUrl: string,
    private readonly profileRepo: ProfileRepository,
  ) {}

  private categorizeAge(age: number): string {
    if (age <= 12) return "child";
    if (age <= 19) return "teenager";
    if (age <= 59) return "adult";
    return "senior";
  }

  private async fetchExternal<T>(
    url: string,
    apiName: ExternalApiName,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      throw new AppError(`${apiName} returned an invalid response`, 502);
    }
    if (!response.ok)
      throw new AppError(`${apiName} returned an invalid response`, 502);
    return response.json() as Promise<T>;
  }

  async createProfile(
    data: ProfileDTO,
  ): Promise<Profile | { message: string; data: Profile }> {
    const existing = await this.profileRepo.findByName(data.name);
    if (existing) return { message: "Profile already exists", data: existing };

    const [genderData, ageData, countryData] = await Promise.all([
      this.fetchExternal<GenderizeExternalApiResponse>(
        `${this.genderizeApiUrl}/?name=${data.name}`,
        "Genderize",
      ),
      this.fetchExternal<AgifyExternalApiResponse>(
        `${this.agifyApiUrl}/?name=${data.name}`,
        "Agify",
      ),
      this.fetchExternal<NationalizeExternalApiResponse>(
        `${this.nationalizeApiUrl}/?name=${data.name}`,
        "Nationalize",
      ),
    ]);

    if (!genderData.gender || genderData.count === 0)
      throw new AppError("Genderize returned an invalid response", 502);
    if (ageData.age === null || ageData.age === undefined)
      throw new AppError("Agify returned an invalid response", 502);
    if (!countryData.country?.length)
      throw new AppError("Nationalize returned an invalid response", 502);

    const topCountry = [...countryData.country].sort(
      (a, b) => b.probability - a.probability,
    )[0]!;

    const payload: CreateProfileDTO = {
      name: data.name,
      gender: genderData.gender,
      gender_probability: genderData.probability,
      sample_size: genderData.count,
      age: ageData.age,
      age_group: this.categorizeAge(ageData.age),
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
    };

    return this.profileRepo.create(payload);
  }

  async getProfileById(id: string): Promise<Profile> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new AppError("Profile not found", 404);
    return profile;
  }

  async getAllProfiles(filters: {
    gender?: string;
    country_id?: string;
    age_group?: string;
  }) {
    const profiles = await this.profileRepo.findAllFiltered(filters);

    return profiles.map(({ id, name, gender, age, age_group, country_id }) => ({
      id,
      name,
      gender,
      age,
      age_group,
      country_id,
    }));
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new AppError("Profile not found", 404);
    await this.profileRepo.delete(id);
  }
}
