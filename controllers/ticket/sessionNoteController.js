import { 
    createOne, 
    getAll, 
    getOne, 
    updateOne, 
    deleteOne 
  } from '../../factory/handleFactory.js';
  import { SessionNote } from "../../models/ticket/SessionNote.js";
  import catchAsync from '../../utils/catchAsync.js';
  import { sendSuccessResponse, sendErrorResponse } from '../../utils/responseHandler.js';
  
  // Session Notes CRUD
  // export const createSessionNote = createOne(SessionNote);
  export const getAllSessionNotes = getAll(SessionNote);
  export const getSessionNote = getOne(SessionNote);
  export const updateSessionNote = updateOne(SessionNote);
  export const deleteSessionNote = deleteOne(SessionNote);
 
  
  // Get session notes by ticket ID with pagination
  export const getSessionNotesByTicket = catchAsync(async (req, res) => {
    const ticketId = req.params.ticketId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await SessionNote.countDocuments({ ticket_id: ticketId });
    
    // Get paginated notes
    const notes = await SessionNote.find({ ticket_id: ticketId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    
    sendSuccessResponse(res, {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalResults: totalCount,
      resultsPerPage: limit,
      results: notes.length,
      notes
    }, 'Session notes fetched successfully');
  });
  

// Generate random 8 digit session ID
const generateSessionId = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const createSessionNote = catchAsync(async (req, res) => {
  try {
    const { ticket_id, notes, agent,session_id } = req.body;
    
    if (!ticket_id || !notes) {
      throw new Error('Ticket ID and notes are required');
    }

    const sessionNote = await SessionNote.create({
      ticket_id,
      session_id:session_id || generateSessionId(),
      notes,
      agent,
      created_by: req.user.id
    });

    await sessionNote.populate('created_by');

    sendSuccessResponse(res, sessionNote, 'Session note created successfully');
    
  } catch (error) {
    sendErrorResponse(res, error);
  }
});