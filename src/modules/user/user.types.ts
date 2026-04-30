// UserRoles is a runtime object ({ admin: "admin", analyst: "analyst" }) —
// exported as a value so it can be used in comparisons and route guards.
export { UserRoles } from "@prisma/client";

// User is a type-only export — no runtime object needed.
export type { User } from "@prisma/client";
