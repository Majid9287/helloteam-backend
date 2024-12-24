import express from "express";
import {
  createSessionFormData,
  getAllSessionFormData,
  getSessionFormData,
  updateSessionFormData,
  deleteSessionFormData,
  getSessionFormDataByTicket,
} from "../controllers/ticket/formDataController.js";

const router = express.Router();
// Session Form Data Routes
router.route("/forms").post(createSessionFormData).get(getAllSessionFormData);

router
  .route("/forms/:id")
  .get(getSessionFormData)
  .patch(updateSessionFormData)
  .delete(deleteSessionFormData);

// Get form data by ticket ID (with pagination)
router.route("/:ticketId/forms").get(getSessionFormDataByTicket);

export default router;
