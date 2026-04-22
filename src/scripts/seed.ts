import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { ProfileModel } from "../modules/profile/profile.model";
import data from "../../seed_profiles.json";
import { envConfig } from "../config/env.config";
import { CreateProfileDTO } from "../modules/profile/profile.dtos";

async function seed() {
  const profiles = data.profiles.map((profile: CreateProfileDTO) => ({
    name: profile.name,
    gender: profile.gender,
    gender_probability: profile.gender_probability,
    age: profile.age,
    age_group: profile.age_group,
    country_id: profile.country_id,
    country_name: profile.country_name,
    country_probability: profile.country_probability,
  }));

  try {
    await mongoose.connect(envConfig.mongoUrl);

    // Option A: insert many but ignore duplicates
    await ProfileModel.insertMany(profiles, { ordered: false });

    console.log(`Seeding completed with ${profiles.length} profiles`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
