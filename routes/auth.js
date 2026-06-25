import express from "express";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/login", loginLimiter, login);

router.post("/register", registerLimiter, register);

router.get("/verify-email", verifyEmail);

router.post("/forgot-password", loginLimiter, forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
