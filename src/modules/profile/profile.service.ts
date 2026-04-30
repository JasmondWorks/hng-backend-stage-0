import { countriesList } from "../../common/constants/countries";
import { QueryParams } from "../../common/repositories/base.repository.interface";
import { AppError } from "../../utils/app-error.util";
import { transformToFilters } from "../../utils/filter-transformer.util";
import { parseNaturalQuery } from "../../utils/nl-query-parser.util";
import { CreateProfileDTO, ProfileDTO } from "./profile.dtos";
import { ProfileRepository } from "./profile.repository";
import {
  AgifyExternalApiResponse,
  GenderizeExternalApiResponse,
  NationalizeExternalApiResponse,
  Profile,
} from "./profile.types";

type ExternalApiName = "Genderize" | "Agify" | "Nationalize";

interface ProfileQueryParams extends QueryParams {
  q?: string;
  gender?: string;
  country_id?: string;
  age_group?: string;
  min_age?: string;
  max_age?: string;
  min_gender_probability?: string;
  min_country_probability?: string;
  max_country_probability?: string;
}

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
    } catch (err) {
      console.error(`[${apiName}] fetch failed for url=${url}:`, err);
      throw new AppError(`${apiName} returned an invalid response`, 502);
    }
    if (!response.ok) {
      console.error(
        `[${apiName}] non-ok status ${response.status} for url=${url}`,
      );
      throw new AppError(`${apiName} returned an invalid response`, 502);
    }
    return response.json() as Promise<T>;
  }

  async createProfile(
    data: ProfileDTO,
  ): Promise<Profile | { message: string; data: Profile }> {
    const existing = await this.profileRepo.findByName(data.name);
    if (existing) return { message: "Profile already exists", data: existing };

    const encodedName = encodeURIComponent(data.name);
    const [genderData, ageData, countryData] = await Promise.all([
      this.fetchExternal<GenderizeExternalApiResponse>(
        `${this.genderizeApiUrl}?name=${encodedName}`,
        "Genderize",
      ),
      this.fetchExternal<AgifyExternalApiResponse>(
        `${this.agifyApiUrl}?name=${encodedName}`,
        "Agify",
      ),
      this.fetchExternal<NationalizeExternalApiResponse>(
        `${this.nationalizeApiUrl}?name=${encodedName}`,
        "Nationalize",
      ),
    ]);

    const validations = [
      {
        valid: genderData.gender !== null && genderData.count !== 0,
        api: "Genderize",
      },
      {
        valid: ageData.age != null,
        api: "Agify",
      },
      {
        valid: !!countryData.country?.length,
        api: "Nationalize",
      },
    ];

    for (const v of validations) {
      if (!v.valid) {
        throw new AppError(`${v.api} returned an invalid response`, 502);
      }
    }

    const topCountry = [...countryData.country].sort(
      (a, b) => b.probability - a.probability,
    )[0]!;

    const payload: CreateProfileDTO = {
      name: data.name,
      gender: genderData.gender,
      gender_probability: genderData.probability,
      age: ageData.age!,
      age_group: this.categorizeAge(ageData.age!),
      country_id: topCountry.country_id,
      country_name:
        countriesList.find(
          (country) => country.country_code === topCountry.country_id,
        )?.country_name ?? topCountry.country_id,
      country_probability: topCountry.probability,
    };

    return this.profileRepo.create(payload);
  }

  async getProfileById(id: string): Promise<Profile> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new AppError("Profile not found", 404);
    return profile;
  }

  async getAllProfiles(queryParams: ProfileQueryParams) {
    const { q, ...rest } = queryParams;

    if (q) {
      return this.getProfilesBySearchQuery(queryParams);
    }

    const result = await this.profileRepo.findAllWithPagination(rest);

    return { data: result.data, pagination: result.pagination };
  }

  async getProfilesBySearchQuery(queryParams: ProfileQueryParams) {
    const { q, ...rest } = queryParams;

    const parsed = parseNaturalQuery(q!);

    if (!parsed) {
      throw new AppError("Unable to interpret query", 400);
    }

    const filters = transformToFilters(parsed);

    const searchParams = { ...rest, ...filters };

    const result = await this.profileRepo.findAllWithPagination(
      searchParams as any,
    );

    return { data: result.data, pagination: result.pagination };
  }

  async exportProfiles(queryParams: ProfileQueryParams): Promise<Profile[]> {
    const { q, ...rest } = queryParams;
    if (q) {
      const parsed = parseNaturalQuery(q);
      if (!parsed) throw new AppError("Unable to interpret query", 400);
      const filters = transformToFilters(parsed);
      return this.profileRepo.findAllRaw({ ...rest, ...filters } as any);
    }
    return this.profileRepo.findAllRaw(rest);
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new AppError("Profile not found", 404);
    await this.profileRepo.delete(id);
  }
}
