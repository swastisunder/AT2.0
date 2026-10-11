import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import User from "./user.model.js";

import ApiError from "../../common/utils/apiError.js";
import ApiResponse from "../../common/utils/apiResponse.js";
import asyncHandler from "../../common/utils/asyncHandler.js";
import {
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "../../common/config/envConfig.js";
import { USER_ROLES } from "../../common/utils/constand/user.js";
import { hashToken } from "../../common/utils/crypto.js";

const DUMMY_BCRYPT_HASH =
  "$2a$10$7EqJtq98hPqEX7fNZaFWoOhi5VpIqL3g8.yP8/H4jUuF4U8dZ3.2q";

export const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    throw ApiError.conflict("User with this email already exists");
  }

  const user = new User({
    ...req.body,
    role: USER_ROLES.USER,
  });

  const refreshToken = user.generateRefreshToken();
  user.refreshToken = hashToken(refreshToken);

  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict("User with this email already exists");
    }
    throw error;
  }

  const data = {
    user,
    accessToken: user.generateAccessToken(),
    refreshToken,
  };

  return ApiResponse.created(res, "User registered successfully", data);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // Perform dummy bcrypt comparison to mitigate timing attacks
    await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
    throw ApiError.unauthorized("Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Account is deactivated. Please contact support.");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = hashToken(refreshToken);
  await user.save();

  const data = {
    user,
    accessToken,
    refreshToken,
  };

  return ApiResponse.ok(res, "Login successful", data);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw ApiError.badRequest("Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const oldHash = hashToken(incomingRefreshToken);

  // Generate new refresh token and hash it before the atomic update
  const newRefreshToken = jwt.sign(
    { id: decoded.id, jti: randomUUID() },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      algorithm: "HS256",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );

  const newHash = hashToken(newRefreshToken);

  // Atomically verify old token hash, ensure active user, and swap to new token hash
  const user = await User.findOneAndUpdate(
    { _id: decoded.id, refreshToken: oldHash, isActive: true },
    { refreshToken: newHash },
    { new: true },
  );

  if (!user) {
    throw ApiError.unauthorized("Refresh token is invalid or has been revoked");
  }

  const accessToken = user.generateAccessToken();

  const data = {
    accessToken,
    refreshToken: newRefreshToken,
  };

  return ApiResponse.ok(res, "Tokens refreshed successfully", data);
});

export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, "User profile retrieved successfully", req.user);
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
    $inc: { tokenVersion: 1 },
  });
  return ApiResponse.ok(res, "Logged out successfully");
});

export default { register, login, refreshToken, getMe, logout };
