import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { deleteUser } from "../controllers/users.js";
import { createAdminAccount } from "../controllers/auth.js";

const router = express.Router();

router.delete("/users/:id", requireAuth, requireRole("ADMIN"), deleteUser);

router.patch(
  "/links/:id/feature",
  requireAuth,
  requireRole("ADMIN", "MODERATOR"),
);

router.post(
  "/admin/create-user",
  requireAuth,
  requireRole("ADMIN"),
  createAdminAccount,
);

export default router;
