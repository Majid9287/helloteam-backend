import express from "express";
import {
  createTicket,
  getAllTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  getTicketsByOrganization,
  assignTicket,
} from "../controllers/ticket/ticketController.js";

const router = express.Router();

router.route("/").post(createTicket).get(getAllTickets);

router.route("/:id").get(getTicket).patch(updateTicket).delete(deleteTicket);

router.route("/organization/:organizationId").get(getTicketsByOrganization);

router.route("/:id/assign").put(assignTicket);

export default router;
