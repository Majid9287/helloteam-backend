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


import User from "../../models/UserModel.js";

import mongoose from "mongoose";
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
    const tickets = await Ticket.find(query).populate('assigned_agent').sort('-created_at');
    
    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: { tickets }
    });
  });
  


export const assignTicket = catchAsync(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { agentId, supervisorId } = req.body;
    const ticketId = req.params.id;
    
    // Check if at least one ID is provided
    if (!agentId && !supervisorId) {
      throw new AppError('Either agent or supervisor ID must be provided', 400);
    }

    // Get current ticket state to check existing assignments
    const currentTicket = await Ticket.findById(ticketId);
    if (!currentTicket) {
      throw new AppError('Ticket not found', 404);
    }

    // Handle agent reassignment
    if (agentId) {
      // Check if new agent exists and is actually an agent
      const newAgent = await User.findOne({ 
        _id: agentId, 
        role: 'agent'
      });
      
      if (!newAgent) {
        throw new AppError('Agent not found or user is not an agent', 404);
      }

      // If there's an existing agent, remove ticket from their list
      if (currentTicket.assigned_agent) {
        await User.findByIdAndUpdate(
          currentTicket.assigned_agent,
          { $pull: { tickets: ticketId } },
          { session }
        );
      }

      // Add ticket to new agent's list
      await User.findByIdAndUpdate(
        agentId,
        { $addToSet: { tickets: ticketId } },
        { session }
      );
    }

    // Handle supervisor reassignment
    if (supervisorId) {
      // Check if new supervisor exists and is actually a supervisor
      const newSupervisor = await User.findOne({ 
        _id: supervisorId, 
        role: 'supervisor'
      });
      
      if (!newSupervisor) {
        throw new AppError('Supervisor not found or user is not a supervisor', 404);
      }

      // If there's an existing supervisor, remove ticket from their list
      if (currentTicket.assigned_supervisor) {
        await User.findByIdAndUpdate(
          currentTicket.assigned_supervisor,
          { $pull: { tickets: ticketId } },
          { session }
        );
      }

      // Add ticket to new supervisor's list
      await User.findByIdAndUpdate(
        supervisorId,
        { $addToSet: { tickets: ticketId } },
        { session }
      );
    }

    // Create update object for ticket
    const updateData = {
      status: 'in_progress',
      ...(agentId && { assigned_agent: agentId }),
      ...(supervisorId && { assigned_supervisor: supervisorId })
    };

    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      updateData,
      { 
        new: true, 
        runValidators: true,
        session 
      }
    ).populate([
      { path: 'assigned_agent', select: 'name email role' },
      { path: 'assigned_supervisor', select: 'name email role' }
    ]);

    await session.commitTransaction();

    sendSuccessResponse(res, updatedTicket, 'Ticket assigned successfully');
      
  } catch (error) {
    sendErrorResponse(res, error);

  } finally {
    session.endSession();
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

 // Add these new controller methods to your existing file

export const getTicketWithTree = catchAsync(async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    console.log(req.params.id)
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Get all nodes for this ticket
    const nodes = await Node.find({ ticket_id: ticket._id });
    console.log(ticket,nodes )
    // Create a map of nodes for easier tree building
    const nodeMap = {};
    nodes.forEach(node => {
      nodeMap[node.node_id] = {
        ...node.toObject(),
        children: []
      };
    });

    // Build the tree structure
    nodes.forEach(node => {
      if (node.buttons) {
        node.buttons.forEach(button => {
          if (button.button_link && nodeMap[button.button_link]) {
            nodeMap[node.node_id].children.push(nodeMap[button.button_link]);
          }
        });
      }
    });

    // Find the root node (node with no parent)
    const rootNode = nodes.find(node => !nodes.some(n => 
      n.buttons?.some(b => b.button_link === node.node_id)
    ));

    const treeStructure = rootNode ? nodeMap[rootNode.node_id] : null;

    sendSuccessResponse(res, {
      ticket,
      tree: treeStructure
    }, 'Ticket tree fetched successfully');

  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const getAllTicketsWithTree = catchAsync(async (req, res) => {
  try {
    const tickets = await Ticket.find(req.query);
    
    // Get trees for all tickets
    const ticketsWithTrees = await Promise.all(tickets.map(async (ticket) => {
      const nodes = await Node.find({ ticket_id: ticket._id });
      
      // Create nodes map
      const nodeMap = {};
      nodes.forEach(node => {
        nodeMap[node.node_id] = {
          ...node.toObject(),
          children: []
        };
      });

      // Build relationships
      nodes.forEach(node => {
        if (node.buttons) {
          node.buttons.forEach(button => {
            if (button.button_link && nodeMap[button.button_link]) {
              nodeMap[node.node_id].children.push(nodeMap[button.button_link]);
            }
          });
        }
      });

      // Find root node
      const rootNode = nodes.find(node => !nodes.some(n => 
        n.buttons?.some(b => b.button_link === node.node_id)
      ));

      return {
        ticket,
        tree: rootNode ? nodeMap[rootNode.node_id] : null
      };
    }));

    sendSuccessResponse(res, {
      results: ticketsWithTrees.length,
      tickets: ticketsWithTrees
    }, 'Tickets with trees fetched successfully');

  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const updateNode = catchAsync(async (req, res) => {
  try {
    const { ticketId, nodeId } = req.params;
    const updateData = req.body;

    const node = await Node.findOneAndUpdate(
      { ticket_id: ticketId, node_id: nodeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!node) {
      throw new AppError('Node not found', 404);
    }

    sendSuccessResponse(res, { node }, 'Node updated successfully');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const createNode = catchAsync(async (req, res) => {
  try {
    const { ticketId } = req.params;
    const nodeData = req.body;

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Create new node
    const node = await Node.create({
      ...nodeData,
      ticket_id: ticketId
    });

    // Update ticket's nodes array
    await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { nodes: node._id } }
    );

    sendSuccessResponse(res, { node }, 'Node created successfully');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const deleteNode = catchAsync(async (req, res) => {
  try {
    const { ticketId, nodeId } = req.params;

    // Delete node
    const node = await Node.findOneAndDelete({
      ticket_id: ticketId,
      node_id: nodeId
    });

    if (!node) {
      throw new AppError('Node not found', 404);
    }

    // Remove node reference from ticket
    await Ticket.findByIdAndUpdate(ticketId, {
      $pull: { nodes: node._id }
    });

    sendSuccessResponse(res, null, 'Node deleted successfully');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

// Add this utility function to help with tree operations
const buildTreeStructure = (nodes) => {
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.node_id] = {
      ...node.toObject(),
      children: []
    };
  });

  nodes.forEach(node => {
    if (node.buttons) {
      node.buttons.forEach(button => {
        if (button.button_link && nodeMap[button.button_link]) {
          nodeMap[node.node_id].children.push(nodeMap[button.button_link]);
        }
      });
    }
  });

  return nodeMap;
};
export const updateTicketStatus = catchAsync(async (req, res) => {
  const { id: ticketId } = req.params;
  const { status } = req.body;

  // Validate the new status
  const validStatuses = ["new", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Invalid status value", 400);
  }

  // Update the ticket's status
  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status },
    { new: true, runValidators: true }
  ).populate("assigned_agent");;

  // Check if the ticket was found
  if (!updatedTicket) {
    throw new AppError("Ticket not found", 404);
  }

  // Send the updated ticket as a response
  sendSuccessResponse(res, updatedTicket, "Ticket status updated successfully");
});
export const setTicketPriority = catchAsync(async (req, res) => {
  const { id: ticketId } = req.params;
  const { priority } = req.body;

  // Validate priority
  const validPriorities = ["low", "medium", "high", "urgent"];
  if (!validPriorities.includes(priority)) {
    throw new AppError("Invalid priority value", 400);
  }

  const updatedTicket = await Ticket.findByIdAndUpdate(
    ticketId,
    { priority },
    { new: true, runValidators: true }
  ).populate("assigned_agent");;

  if (!updatedTicket) {
    throw new AppError("Ticket not found", 404);
  }

  sendSuccessResponse(res,  updatedTicket , "Priority updated successfully");
});
