import mongoose, { Schema } from "mongoose";
import { AvailableUserRoles, UserRoleEnum } from "../utils/constants.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema({
  avatar: {
    type: {
      url: String,
      localpath: String,
    },
    default: {
      url: `https://placehold.co/600x400`,
      localpath: "",
    },
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  fullname: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  forgotPasswordToken: {
    type: String,
  },
  forgotPasswordExpiry: {
    type: Date,
  },
  refreshToken: {
    type: String,
  },
  refreshTokenExpiry: {
    type: Date,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpiry: {
    type: Date,
  },
  role: {
    type: String,
    enum: AvailableUserRoles,
    default: UserRoleEnum.MEMBER,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  const token = await jwt.sign(
    { _id: this._id, email: this.email, username: this.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" },
  );
  const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
  return { token, tokenExpiry };
};

userSchema.methods.generateRefreshToken = async function () {
  const token = await jwt.sign(
    { _id: this._id, email: this.email, username: this.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { token, tokenExpiry };
};

userSchema.methods.generateTemporaryToken = async function () {
  const unhashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unhashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000;

  return { unhashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
