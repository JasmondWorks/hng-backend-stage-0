import { Request, Response } from "express";
import { sendSuccess } from "../../utils/api-response.util";
import { UserService } from "./user.service";
import { UserRoles } from "./user.types";
import { AppError } from "../../utils/app-error.util";

export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users/me — available to any authenticated user
  async getMe(req: Request, res: Response) {
    sendSuccess(res, req.user, { statusCode: 200 });
  }

  // GET /users — admin only
  async getAllUsers(_req: Request, res: Response) {
    const users = await this.userService.findAll();
    sendSuccess(res, users, { statusCode: 200 });
  }

  // PATCH /users/:id/role — admin only
  async updateUserRole(req: Request, res: Response) {
    const { role } = req.body as { role: string };
    if (!Object.values(UserRoles).includes(role as UserRoles)) {
      throw new AppError(
        `Invalid role. Must be one of: ${Object.values(UserRoles).join(", ")}`,
        400,
      );
    }
    const user = await this.userService.updateRole(
      req.params.id as string,
      role as UserRoles,
    );
    sendSuccess(res, user, { statusCode: 200 });
  }
}
