import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadOnClodinary } from "../utils/cloudinary.js";
import { emailVerificationMailGenContent, sendMail } from "../utils/mail.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  if (!username || !email || !password || !role) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const newUser = await User.create({
    email,
    username,
    password,
    role,
  });

  if (!newUser) {
    throw new ApiError(400, "User not created");
  }

  const { hashedToken, tokenExpiry } = await newUser.generateTemporaryToken();
  newUser.emailVerificationToken = hashedToken;
  newUser.emailVerificationExpiry = tokenExpiry;

  await newUser.save();

  await sendMail({
    email: newUser.email,
    subject: "Verify your email",
    mailGenContent: emailVerificationMailGenContent(
      newUser.username,
      `${process.env.BASE_URL}/api/v1/auth/verify-email/${hashedToken}`,
    ),
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user: {
          _id: newUser._id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        },
        token: hashedToken,
      },
      "User registered successfully. Email verfication link sent to your email",
    ),
  );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await existingUser.isPasswordMatch(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  let refreshToken = existingUser.refreshToken;
  let refreshTokenExpiry = existingUser.refreshTokenExpiry;

  const tokenExpired =
    !refreshToken ||
    !refreshTokenExpiry ||
    refreshTokenExpiry < new Date(Date.now());

  if (tokenExpired) {
    try {
      const generated = await existingUser.generateRefreshToken();
      refreshToken = generated.token;
      refreshTokenExpiry = generated.tokenExpiry;

      existingUser.refreshToken = refreshToken;
      existingUser.refreshTokenExpiry = refreshTokenExpiry;
      await existingUser.save();
    } catch (error) {
      console.error("Error during refresh token generation:", error);
      throw new ApiError(400, "Error logging in user");
    }
  }

  res.cookie("token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role,
        },
      },
      `Welcome back ${existingUser.username}`,
    ),
  );
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.refreshToken = undefined;
  user.refreshTokenExpiry = undefined;
  await user.save();

  res.clearCookie("token");
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.id;
  const { fullname } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (fullname) {
    user.fullname = fullname;
  }

  if (req.file) {
    const cloudinaryResult = await uploadOnClodinary(req.file.path, "avatars");

    user.avatar.url = cloudinaryResult.secure_url;
  }

  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "User Details Updated Successfully"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    throw new ApiError(400, "Invalid or Expired Token");
  }

  if (user.emailVerificationExpiry < Date.now()) {
    throw new ApiError(400, "Token Expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Email verified successfully"));
});

export const resendVerficationEmail = asyncHandler(async (req, res) => {
  // login
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  // logic
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  const { hashedToken, tokenExpiry } = await user.generateTemporaryToken();
  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save();

  await sendMail({
    email: user.email,
    subject: "Change Your Password",
    mailGenContent: emailVerificationMailGenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/auth/change-password/${hashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password reset mail sent"));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({ forgotPasswordToken: token });
  if (!user) {
    throw new ApiError(404, "Invalid or Expired Token");
  }

  if (user.forgotPasswordExpiry < Date.now()) {
    throw new ApiError(
      400,
      "Token expired. Please request a new password reset",
    );
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.id;

  const user = await User.findById(userId).select(
    "-password -isEmailVerified -forgotPasswordToken -forgotPasswordExpiry -refreshToken -refreshTokenExpiry -emailVerificationToken -emailVerificationExpiry",
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          avatar: user.avatar.url,
        },
      },
      `${user.fullname}'s information`,
    ),
  );
});
