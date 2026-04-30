import { v7 as uuidv7 } from "uuid";
import { prisma } from "../../db/prisma";
import { BaseRepository } from "../../common/repositories/base.repository";
import { CreateProfileDTO, UpdateProfileDTO } from "./profile.dtos";
import { Profile } from "./profile.types";

// Mongoose equivalent:
//   super(ProfileModel)  ← passed the Mongoose Model class
//
// Prisma equivalent:
//   delegate = prisma.profile  ← pass the model's delegate from the Prisma client
//
// The delegate is just the namespaced API for this table:
//   prisma.profile.findMany(...)  ===  ProfileModel.find(...)

export class ProfileRepository extends BaseRepository<
  Profile,
  CreateProfileDTO,
  UpdateProfileDTO
> {
  protected readonly delegate = prisma.profile;

  // UUID v7 must be generated in application code because PostgreSQL has no built-in
  // UUID v7 generator. Mongoose did this via schema default: () => uuidv7().
  async create(data: CreateProfileDTO): Promise<Profile> {
    return prisma.profile.create({
      data: { ...data, id: uuidv7() },
    }) as unknown as Profile;
  }

  // Prisma findUnique requires the field to be @id or @unique.
  // Our id column is @id in schema.prisma, so this is a direct index lookup.
  async findById(id: string): Promise<Profile | null> {
    return prisma.profile.findUnique({ where: { id } }) as unknown as Profile | null;
  }

  async delete(id: string): Promise<void> {
    await prisma.profile.delete({ where: { id } });
  }

  // Mongoose equivalent: ProfileModel.findOne({ name: { $regex: /^name$/i } })
  // Prisma equivalent:   prisma.profile.findFirst({ where: { name: { equals: name, mode: "insensitive" } } })
  async findByName(name: string): Promise<Profile | null> {
    return prisma.profile.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    }) as unknown as Profile | null;
  }
}
