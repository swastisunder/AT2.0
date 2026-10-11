import { Router } from "express";
import validate from "../../common/middleware/validate.middleware.js";
import { RegisterDto, LoginDto, RefreshDto } from "./dto/index.js";
import authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";
import {
  loginLimiter,
  registerLimiter,
  refreshLimiter,
} from "../../common/middleware/rateLimiter.js";

const router = Router();

router.post(
  "/register",
  registerLimiter,
  validate(RegisterDto),
  authController.register,
);

router.post("/login", loginLimiter, validate(LoginDto), authController.login);

router.post(
  "/refresh",
  refreshLimiter,
  validate(RefreshDto),
  authController.refreshToken,
);

router.get("/me", authenticate, authController.getMe);

router.post("/logout", authenticate, authController.logout);

export default router;
