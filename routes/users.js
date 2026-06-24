import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../lib/multer.js";
import { uploadAvatar } from "../controllers/users.js";
import { handleMulterError } from "../middleware/multerErrorHandler.js";

const router = express.Router();

router.post(
  "/avatar",
  requireAuth,
  upload.single("avatar"),
  handleMulterError,
  uploadAvatar,
);

export default router;
