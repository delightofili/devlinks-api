import express from "express";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiter.js";
import { login, register } from "../controllers/auth.js";

const router = express.Router();

router.post("/login", loginLimiter, login);

router.post("/register", registerLimiter, register);

export default router;
