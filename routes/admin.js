import express from "express";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { deleteUser } from "../controllers/users";

const router = express.Router();

router.delete("/users/:id", requireAuth, requireRole("ADMIN"), deleteUser);

router.patch(
  "/links/:id/feature",
  requireAuth,
  requireRole("ADMIN", "MODERATOR"),
);
