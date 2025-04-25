import { Router } from "express";
import {
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateProfile,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidation,
  userRegistrationValidator,
} from "../validators/index.js";
import { isAuthenticated } from "../middlewares/authenticate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/register", userRegistrationValidator(), validate, registerUser);
router.post("/verify-email/:token", verifyEmail);
router.post("/login", userLoginValidation(), validate, loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.post(
  "/update-profile",
  isAuthenticated,
  upload.single("avatar"),
  updateProfile,
);
router.post("/forgot-password", forgotPasswordRequest);
router.post("/change-password/:token", changeCurrentPassword);
router.get("/get-user", isAuthenticated, getCurrentUser);

export default router;
