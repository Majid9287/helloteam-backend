import express from "express";
import {
  getProfile,
  createUser,
  getUsersByRole,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, getProfile);
router.post("/:organization/create", protect, createUser);
router.get("/:organization", protect, getUsersByRole);

export default router;
