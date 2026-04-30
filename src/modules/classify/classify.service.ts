import { AppError } from "../../utils/app-error.util";
import {
  ClassifyExternalApiResponse,
  ClassifyResponse,
} from "./classify.types";
import { ClassifyQueryDTO } from "./classify.dtos";

export class ClassifyService {
  constructor(private readonly genderizeApi: string) {}

  async classifyName(data: ClassifyQueryDTO): Promise<ClassifyResponse> {
    const serverErrorMessage = "Upstream or server failure";
    let response: Response;

    try {
      response = await fetch(`${this.genderizeApi}/?name=${encodeURIComponent(data.name)}`);
    } catch (err) {
      console.error("Fetch failed:", err);
      throw new AppError(serverErrorMessage, 502);
    }

    if (!response.ok) throw new AppError(serverErrorMessage, 500);

    const { name, gender, probability, count } =
      (await response.json()) as ClassifyExternalApiResponse;

    return {
      name,
      gender,
      probability,
      sample_size: count,
      is_confident: probability > 0.7 && count >= 100,
    };
  }
}
