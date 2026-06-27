import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getNotification,
  getUnreadCount,
  markAllRead,
} from "../services/notifications";

const router = express.Router();

router(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const notifications = await getNotification(req.userId);
    res.json(notifications);
  }),
);

router.get(
  "/count",
  requireAuth,
  asyncHandler(async (req, res) => {
    const count = await getUnreadCount(req.userId);
    res.json({ count });
  }),
);

router.patch(
  "/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    await markAllRead(req.userId);
    res.json({ message: "All notification marked as read" });
  }),
);

export default router;
