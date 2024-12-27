import express from "express";
import {
  createSessionNote,
  getAllSessionNotes,
  getSessionNote,
  updateSessionNote,
  deleteSessionNote,
  getSessionNotesByTicket,
} from "../controllers/ticket/sessionNoteController.js";
import { protect } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Session Notes Routes
router.route("/").all(protect).post(createSessionNote).get(getAllSessionNotes);

router
  .route("/notes/:id")
  .get(getSessionNote)
  .patch(updateSessionNote)
  .delete(deleteSessionNote);

// Get notes by ticket ID (with pagination)
router.route("/:ticketId/notes").get(getSessionNotesByTicket);

export default router;
