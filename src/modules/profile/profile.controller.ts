import { Request, Response } from "express";
import { ProfileDTO } from "./profile.dtos";
import { ProfileService } from "./profile.service";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async createProfile(req: Request, res: Response) {
    const data: ProfileDTO = req.body;
    const result = await this.profileService.createProfile(data);

    if ("message" in result) {
      res.status(200).json({
        status: "success",
        message: result.message,
        data: result.data,
      });
      return;
    }

    res.status(201).json({ status: "success", data: result });
  }

  async getProfileById(req: Request, res: Response) {
    const data = await this.profileService.getProfileById(
      req.params.id as string,
    );
    res.status(200).json({ status: "success", data });
  }

  async getAllProfiles(req: Request, res: Response) {
    const { gender, country_id, age_group } = req.query as {
      gender?: string;
      country_id?: string;
      age_group?: string;
    };

    const data = await this.profileService.getAllProfiles({
      gender: gender as string,
      country_id: country_id as string,
      age_group: age_group as string,
    });
    res.status(200).json({ status: "success", count: data.length, data });
  }

  async deleteProfile(req: Request, res: Response) {
    await this.profileService.deleteProfile(req.params.id as string);
    res.status(204).send();
  }
}
