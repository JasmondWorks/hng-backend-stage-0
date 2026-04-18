import { v7 as uuidv7 } from "uuid";
import { model, Schema } from "mongoose";

const profileSchema = new Schema(
  {
    _id: { type: String, default: () => uuidv7() },
    name: { type: String, required: true, unique: true },
    gender: { type: String, default: null },
    gender_probability: { type: Number, required: true },
    sample_size: { type: Number, required: true },
    age: { type: Number, required: true },
    age_group: { type: String, required: true },
    country_id: { type: String, required: true },
    country_probability: { type: Number, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } },
);

export const ProfileModel = model("Profile", profileSchema);
