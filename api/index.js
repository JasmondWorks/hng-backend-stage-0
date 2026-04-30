"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../src/app"));
// Mongoose had an explicit connectDB() call here with an isDbConnected flag
// because the connection was async and had to be established before handling requests.
//
// Prisma connects lazily on the first query and manages its own connection pool,
// so there is nothing to await here. The handler is just the Express app.
const handler = async (req, res) => {
    return (0, app_1.default)(req, res);
};
exports.default = handler;
//# sourceMappingURL=index.js.map