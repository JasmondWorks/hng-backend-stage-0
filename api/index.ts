import app from "../src/app";

// Mongoose had an explicit connectDB() call here with an isDbConnected flag
// because the connection was async and had to be established before handling requests.
//
// Prisma connects lazily on the first query and manages its own connection pool,
// so there is nothing to await here. The handler is just the Express app.

const handler = async (req: any, res: any) => {
  return app(req, res);
};

export default handler;
