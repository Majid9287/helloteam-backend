import { 
    createOne, 
    getAll, 
    getOne, 
    updateOne, 
    deleteOne 
  } from '../../factory/handleFactory.js';
  import { Ticket } from "../../models/ticket/TicketModel.js";
  import { Node } from "../../models/ticket/NodeModel.js";
  import catchAsync from '../../utils/catchAsync.js';
  import AppError from '../../utils/appError.js';
  import { sendSuccessResponse, sendErrorResponse } from '../../utils/responseHandler.js';
  // Use factory methods for standard CRUD
  export const createTicket = createOne(Ticket);
  export const getAllTickets = getAll(Ticket);
  export const getTicket = getOne(Ticket);
  export const updateTicket = updateOne(Ticket);
  export const deleteTicket = deleteOne(Ticket);
  
  // Custom ticket-specific controllers
  export const getTicketsByOrganization = catchAsync(async (req, res) => {
    const query = { 
      organization: req.params.organizationId 
    };
    const tickets = await Ticket.find(query)
     
      .sort('-created_at');
  
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: { tickets }
    });
  });
  
  export const assignTicket = catchAsync(async (req, res) => {
    try {
      const { agentId, supervisorId } = req.body;
      
      // Check if at least one ID is provided
      if (!agentId && !supervisorId) {
        throw new Error('Either agent or supervisor ID must be provided');
      }
  
      // Create update object
      const updateData = {
        status: 'in_progress'
      };
  
      if (agentId) updateData.assigned_agent = agentId;
      if (supervisorId) updateData.assigned_supervisor = supervisorId;
  
      // Update ticket
      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: 'assigned_agent', select: 'name email' },
        { path: 'assigned_supervisor', select: 'name email' }
      ]);
  
      if (!ticket) {
        throw new Error('Ticket not found');
      }
  
      sendSuccessResponse(res, ticket, 'Ticket assigned successfully');
      
    } catch (error) {
      sendErrorResponse(res, error);
    }
  });

export const addSubnode = catchAsync(async (req, res) => {
    const { ticketId, nodeId } = req.params;
    const subnodeData = req.body;
  
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) throw new AppError('Ticket not found', 404);
  
    const parentNode = ticket.nodes.find(node => node.node_id === nodeId);
    if (!parentNode) throw new AppError('Parent node not found', 404);
  
    if (!parentNode.subnodes) parentNode.subnodes = [];
    parentNode.subnodes.push(subnodeData);
  
    await ticket.save();
  
    res.status(200).json({
      status: 'success',
      data: {
        ticket
      }
    });
  });