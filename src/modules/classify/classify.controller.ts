import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.util";
import { AppError } from "../../utils/app-error.util";
import { ClassifyQueryDTO } from "./classify.dtos";
import { ClassifyService } from "./classify.service";

export class ClassifyController {
  constructor(private readonly classifyService: ClassifyService) {}

  async classifyName(req: Request, res: Response) {
    const query = req.query as unknown as ClassifyQueryDTO;

    const result = await this.classifyService.classifyName(query);

    if (result.gender === null || result.sample_size === 0)
      throw new AppError("No prediction available for the provided name", 404);

    sendSuccess(res, result);
  }
}
