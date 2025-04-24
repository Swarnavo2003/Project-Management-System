import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/api-error.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    throw new ApiError(401, "You are not logged in. Please Login to continue");
  }

  const decode = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  req.id = decode._id;
  next();
});
