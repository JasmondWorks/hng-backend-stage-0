import { query } from "express-validator";

export const classifyNameValidator = [
  query("name")
    .exists()
    .withMessage("Name is required")
    .bail()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .matches(/^[A-Za-z\s\-']+$/)
    .withMessage("Name must contain only letters, spaces, hyphens, or apostrophes"),
];
