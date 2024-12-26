import express from "express";
import {
  createTicket,
  getAllTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getTicketsByOrganization,
  assignTicket,
  getTicketWithTree,
  updateTicketStatus 

} from "../controllers/ticket/ticketController.js";

const router = express.Router();

router.route("/").post(createTicket).get(getAllTickets);
router.patch("/:id/status", updateTicketStatus);
router.route("/:id").patch(updateTicket).delete(deleteTicket);
router.route("/:id/").get(getTicketWithTree);
router.route("/organization/:organizationId").get(getTicketsByOrganization);

router.route("/:id/assign").put(assignTicket);

export default router;
