import { config } from "dotenv";
config({ path: ".env.local" });

import app from "./app";
import { prisma } from "./db/prisma";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // $connect() is optional — Prisma connects lazily. Calling it here just
    // surfaces connection errors at startup instead of on the first request.
    await prisma.$connect();
    console.log("Database connected");
    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
