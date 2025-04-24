import { body } from "express-validator";

export const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ min: 3 })
      .withMessage("Username must be atleast 3 character long")
      .isLength({ max: 15 })
      .withMessage("Username must be atmost 15 characters long"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be atleast 6 characters long")
      .isLength({ max: 12 })
      .withMessage("Password must be atmost 12 characters"),
    body("role").trim().notEmpty().withMessage("Role is required"),
  ];
};

export const userLoginValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be atleast 6 characters long")
      .isLength({ max: 12 })
      .withMessage("Password must be atmost 12 characters"),
  ];
};
