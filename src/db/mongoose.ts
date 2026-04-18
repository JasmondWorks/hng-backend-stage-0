import mongoose from "mongoose";

let cached: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (!cached) {
    cached = mongoose.connect(process.env.MONGO_URL!, { serverSelectionTimeoutMS: 5000 }).then(() => mongoose).catch((err) => {
      cached = null;
      throw err;
    });
  }
  return cached;
}
