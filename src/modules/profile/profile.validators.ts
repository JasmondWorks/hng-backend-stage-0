import { stringBodyValidator } from "../../common/constants/validators";

export const createProfileValidator = stringBodyValidator(
  "name",
  "Missing or empty name",
);
