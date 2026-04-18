import app from "../src/app";
import { connectDB } from "../src/db/mongoose";

let isDbConnected = false;

const handler = async (req: any, res: any) => {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
  }
  return app(req, res);
};

export default handler;
