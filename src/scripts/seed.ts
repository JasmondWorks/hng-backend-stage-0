import { config } from "dotenv";
config({ path: ".env.local" });

import { v7 as uuidv7 } from "uuid";
import { prisma } from "../db/prisma";
import data from "../../seed_profiles.json";
import { CreateProfileDTO } from "../modules/profile/profile.dtos";

// Mongoose equivalent:
//   await mongoose.connect(envConfig.mongoUrl)
//   await ProfileModel.insertMany(profiles, { ordered: false })
//
// Prisma equivalent:
//   prisma.profile.createMany({ data, skipDuplicates: true })
//
// skipDuplicates: true  ===  { ordered: false } in Mongoose —
// both tell the database to skip records that violate a unique constraint
// (the name column) rather than aborting the whole batch.

async function seed() {
  const profiles = (data.profiles as CreateProfileDTO[]).map((profile) => ({
    id: uuidv7(),
    name: profile.name,
    gender: profile.gender ?? "",
    gender_probability: profile.gender_probability,
    age: profile.age,
    age_group: profile.age_group,
    country_id: profile.country_id,
    country_name: profile.country_name,
    country_probability: profile.country_probability,
  }));

  try {
    // await prisma.profile.deleteMany();

    const result = await prisma.profile.createMany({
      data: profiles,
      skipDuplicates: true,
    });

    console.log(
      `Seeding completed. Inserted ${result.count} of ${profiles.length} profiles.`,
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
