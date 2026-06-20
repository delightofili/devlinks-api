import express from "express";
import { loginLimiter } from "../middleware/rateLimiter";
import { login } from "../controllers/auth";
import { generateCsrfToken } from "../server";

const router = express.Router();

router.post("/login", loginLimiter, login);
