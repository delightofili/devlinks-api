import express from "express";
import {
  getAllLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
} from "../controllers/link.js";
import { requireAuth } from "../middleware/auth.js";
import { sanitizeInput } from "../middleware/sanitize.js";

// import all controller functions

const router = express.Router();
// Router() creates a mini Express app
// handles its own routes, gets mounted in server.js

router.get("/", getAllLinks);
// GET /api/links → getAllLinks controller

router.get("/:id", getLinkById);
// GET /api/links/1 → getLinkById controller
// :id captures whatever is in that URL position

router.post("/", requireAuth, sanitizeInput, createLink);
//requireAuth runs first
// if it calls next() — createLink runs next, with req.userId available
// if it sends a 401 response — createLink never runs at all
// POST /api/links → createLink controller

router.patch("/:id", updateLink);
// PATCH /api/links/1 → updateLink controller

router.delete("/:id", deleteLink);
// DELETE /api/links/1 → deleteLink controller

export default router;
