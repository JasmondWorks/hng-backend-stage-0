import { body, query } from "express-validator";

export function stringBodyValidator(fieldName: string, message: string) {
  return [
    body(fieldName)
      .exists()
      .withMessage(message)
      .bail()
      .isString()
      .withMessage(`Unprocessable Entity: Invalid type`)
      .bail()
      .notEmpty()
      .withMessage(`Missing or empty ${fieldName}`)
      .bail()
      .matches(/^[A-Za-z\s\-']+$/)
      .withMessage(`Unprocessable Entity: Invalid type`),
  ];
}

export function stringQueryValidator(fieldName: string, message: string) {
  return [
    query(fieldName)
      .exists()
      .withMessage(message)
      .bail()
      .isString()
      .withMessage("Name must be a string")
      .bail()
      .notEmpty()
      .withMessage("Name is required")
      .bail()
      .matches(/^[A-Za-z\s\-']+$/)
      .withMessage(
        "Name must contain only letters, spaces, hyphens, or apostrophes",
      ),
  ];
}
