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
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        assigned_agent: req.body.agentId,
        status: 'in_progress'
      },
      { new: true, runValidators: true }
    ).populate('assigned_agent', 'name email');
  
    if (!ticket) throw new AppError('Ticket not found', 404);
  
    res.status(200).json({
      status: 'success',
      data: { ticket }
    });
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