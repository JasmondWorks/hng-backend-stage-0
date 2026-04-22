import { Request, Response } from "express";
import { ProfileDTO } from "./profile.dtos";
import { ProfileService } from "./profile.service";
import { sendSuccess } from "../../utils/api-response.util";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async createProfile(req: Request, res: Response) {
    const data: ProfileDTO = req.body;
    const result = await this.profileService.createProfile(data);

    if ("message" in result) {
      // res.status(200).json({
      //   status: "success",
      //   message: result.message,
      //   data: result.data,
      // });
      sendSuccess(res, result.data, result.message, 200);
      return;
    }

    // res.status(201).json({ status: "success", data: result });
    sendSuccess(res, result, undefined, 201);
  }

  async getProfileById(req: Request, res: Response) {
    const data = await this.profileService.getProfileById(
      req.params.id as string,
    );
    // res.status(200).json({ status: "success", data });
    sendSuccess(res, data, undefined, 200);
  }

  async getAllProfiles(req: Request, res: Response) {
    const profiles = await this.profileService.getAllProfiles(req.query, {
      gender: req.query.gender as string,
      country_id: req.query.country_id as string,
      age_group: req.query.age_group as string,
    });
    sendSuccess(res, profiles, undefined, 200);
  }

  async deleteProfile(req: Request, res: Response) {
    await this.profileService.deleteProfile(req.params.id as string);
    // res.status(204).send();
    sendSuccess(res, undefined, undefined, 204);
  }
}
