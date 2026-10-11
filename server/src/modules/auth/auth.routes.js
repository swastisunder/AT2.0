import { Router } from "express";
import validate from "../../common/middleware/validate.middleware.js";
import { RegisterDto, LoginDto } from "./dto/index.js";
import authController from "./auth.controller.js";
import { authenticate } from "./auth.middleware.js";

const router = Router();

router.post("/register", validate(RegisterDto), authController.register);
router.post("/login", validate(LoginDto), authController.login);
router.post("/refresh", authController.refreshToken);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);

export default router;
