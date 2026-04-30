import { prisma } from "../../db/prisma";
import { AppError } from "../../utils/app-error.util";
import { User, UserRoles } from "./user.types";

export class UserService {
  async findById(id: string): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    return user;
  }

  async findAll(): Promise<User[]> {
    return prisma.user.findMany({ orderBy: { created_at: "desc" } });
  }

  async updateRole(id: string, role: UserRoles): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    return prisma.user.update({ where: { id }, data: { role } });
  }
}
