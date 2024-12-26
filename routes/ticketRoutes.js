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
  updateTicketStatus,
  setTicketPriority,
} from "../controllers/ticket/ticketController.js";

const router = express.Router();
router.route("/:id/priority").patch(setTicketPriority);
router.route("/").post(createTicket).get(getAllTickets);
router.route("/:id/status").patch(updateTicketStatus);
router.route("/:id").patch(updateTicket).delete(deleteTicket);
router.route("/:id/").get(getTicketWithTree);
router.route("/organization/:organizationId").get(getTicketsByOrganization);

router.route("/:id/assign").put(assignTicket);

export default router;
