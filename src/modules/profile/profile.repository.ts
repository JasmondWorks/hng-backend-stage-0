import { BaseRepository } from "../../common/repositories/base.repository";
import { CreateProfileDTO, UpdateProfileDTO } from "./profile.dtos";
import { ProfileModel } from "./profile.model";
import { Profile } from "./profile.types";

export class ProfileRepository extends BaseRepository<
  Profile,
  CreateProfileDTO,
  UpdateProfileDTO
> {
  constructor() {
    super(ProfileModel);
  }

  protected toEntity(doc: any): Profile {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    const { _id, __v, ...rest } = obj;
    return rest as Profile;
  }

  async findById(id: string): Promise<Profile | null> {
    return this.findOne({ id });
  }

  async delete(id: string): Promise<void> {
    return this.delete(id);
  }

  async findByName(name: string): Promise<Profile | null> {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const doc = await ProfileModel.findOne({
      name: { $regex: new RegExp(`^${escaped}$`, "i") },
    });
    return doc ? this.toEntity(doc) : null;
  }
}
