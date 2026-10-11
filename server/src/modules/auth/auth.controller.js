import jwt from "jsonwebtoken";
import User from "./user.model.js";
import ApiError from "../../common/utils/apiError.js";
import ApiResponse from "../../common/utils/apiResponse.js";
import asyncHandler from "../../common/utils/asyncHandler.js";
import { JWT_REFRESH_SECRET } from "../../common/config/envConfig.js";

export const register = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    throw ApiError.conflict("User with this email already exists");
  }

  const user = new User(req.body);
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();

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

  user.refreshToken = refreshToken;
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
    decoded = jwt.verify(incomingRefreshToken, JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw ApiError.unauthorized("Refresh token is invalid or has been revoked");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("User account is deactivated");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();

  const data = {
    accessToken,
    refreshToken,
  };

  return ApiResponse.ok(res, "Tokens refreshed successfully", data);
});

export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, "User profile retrieved successfully", req.user);
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return ApiResponse.ok(res, "Logged out successfully");
});

export default { register, login, refreshToken, getMe, logout };
