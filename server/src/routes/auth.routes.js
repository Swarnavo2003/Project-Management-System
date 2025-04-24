import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidation,
  userRegistrationValidator,
} from "../validators/index.js";
import { isAuthenticated } from "../middlewares/authenticate.middleware.js";

const router = Router();

router.post("/register", userRegistrationValidator(), validate, registerUser);
router.post("/verify-email/:token", verifyEmail);
router.post("/login", userLoginValidation(), validate, loginUser);
router.get("/logout", isAuthenticated, logoutUser);

export default router;
