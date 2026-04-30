import { v7 as uuidv7 } from "uuid";
import { prisma } from "../../db/prisma";
import { BaseRepository } from "../../common/repositories/base.repository";
import { CreateClassificationDTO, UpdateClassificationDTO } from "./classify.dtos";
import { Classification } from "./classify.types";

export class ClassificationRepository extends BaseRepository<
  Classification,
  CreateClassificationDTO,
  UpdateClassificationDTO
> {
  protected readonly delegate = prisma.classification;

  async create(data: CreateClassificationDTO): Promise<Classification> {
    return prisma.classification.create({
      data: { ...data, id: uuidv7() },
    }) as unknown as Classification;
  }

  async findByName(name: string): Promise<Classification | null> {
    return prisma.classification.findFirst({
      where: { name },
    }) as unknown as Classification | null;
  }
}
