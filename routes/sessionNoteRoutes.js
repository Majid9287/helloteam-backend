import express from "express";
import {
  createSessionNote,
  getAllSessionNotes,
  getSessionNote,
  updateSessionNote,
  deleteSessionNote,
  getSessionNotesByTicket,
} from "../controllers/ticket/sessionNoteController.js";

const router = express.Router();

// Session Notes Routes
router
  .route("/notes")
  .post( createSessionNote)
  .get(getAllSessionNotes);

router
  .route("/notes/:id")
  .get(getSessionNote)
  .patch( updateSessionNote)
  .delete( deleteSessionNote);

// Get notes by ticket ID (with pagination)
router.route("/:ticketId/notes").get(getSessionNotesByTicket);

export default router;
