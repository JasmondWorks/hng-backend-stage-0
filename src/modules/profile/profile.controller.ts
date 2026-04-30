import { Request, Response } from "express";
import { ProfileDTO } from "./profile.dtos";
import { ProfileService } from "./profile.service";
import { sendSuccess, buildPaginationLinks } from "../../utils/api-response.util";
import type { Profile } from "./profile.types";

const CSV_HEADERS =
  "id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at";

function toCsvValue(val: string | number | boolean | null | Date): string {
  const str = val instanceof Date ? val.toISOString() : String(val ?? "");
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function profileToCsvRow(p: Profile): string {
  return [
    p.id,
    p.name,
    p.gender,
    p.gender_probability,
    p.age,
    p.age_group,
    p.country_id,
    p.country_name,
    p.country_probability,
    p.created_at,
  ]
    .map(toCsvValue)
    .join(",");
}

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async createProfile(req: Request, res: Response) {
    const data: ProfileDTO = req.body;
    const result = await this.profileService.createProfile(data);

    if ("message" in result) {
      sendSuccess(res, result.data, { message: result.message });
      return;
    }
    sendSuccess(res, result, { statusCode: 201 });
  }

  async getProfileById(req: Request, res: Response) {
    const data = await this.profileService.getProfileById(
      req.params.id as string,
    );
    sendSuccess(res, data, { statusCode: 200 });
  }

  async getAllProfiles(req: Request, res: Response) {
    const result = await this.profileService.getAllProfiles(req.query as any);
    const { page, limit, total } = result.pagination;
    const { total_pages, links } = buildPaginationLinks(
      req.originalUrl,
      page,
      limit,
      total,
    );

    sendSuccess(res, result.data, {
      statusCode: 200,
      pagination: { page, limit, total, total_pages, links },
    });
  }

  async getProfilesBySearchQuery(req: Request, res: Response) {
    const result = await this.profileService.getProfilesBySearchQuery(
      req.query as any,
    );
    const { page, limit, total } = result.pagination;
    const { total_pages, links } = buildPaginationLinks(
      req.originalUrl,
      page,
      limit,
      total,
    );

    sendSuccess(res, result.data, {
      statusCode: 200,
      pagination: { page, limit, total, total_pages, links },
    });
  }

  async exportProfiles(req: Request, res: Response) {
    const profiles = await this.profileService.exportProfiles(
      req.query as any,
    );

    const rows = profiles.map(profileToCsvRow);
    const csv = [CSV_HEADERS, ...rows].join("\n");
    const filename = `profiles_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  async deleteProfile(req: Request, res: Response) {
    await this.profileService.deleteProfile(req.params.id as string);
    sendSuccess(res, undefined, { statusCode: 204 });
  }
}
