import { 
    createOne, 
    getAll, 
    getOne, 
    updateOne, 
    deleteOne 
  } from '../../factory/handleFactory.js';
  import catchAsync from '../../utils/catchAsync.js';
  import { sendSuccessResponse, sendErrorResponse } from '../../utils/responseHandler.js';
  
  import { SessionFormData } from "../../models/ticket/SessionFormData.js";

  
  // Session Form Data CRUD
  export const createSessionFormData = createOne(SessionFormData);
  export const getAllSessionFormData = getAll(SessionFormData);
  export const getSessionFormData = getOne(SessionFormData);
  export const updateSessionFormData = updateOne(SessionFormData);
  export const deleteSessionFormData = deleteOne(SessionFormData);

  
  // Get session form data by ticket ID with pagination
  export const getSessionFormDataByTicket = catchAsync(async (req, res) => {
    const ticketId = req.params.ticketId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const totalCount = await SessionFormData.countDocuments({ ticket_id: ticketId });
    
    // Get paginated form data
    const formData = await SessionFormData.find({ ticket_id: ticketId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    
    sendSuccessResponse(res, {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalResults: totalCount,
      resultsPerPage: limit,
      results: formData.length,
      formData
    }, 'Session form data fetched successfully');
  });