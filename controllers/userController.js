import User from '../models/UserModel.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler.js';

export const getProfile = catchAsync(async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('organization')
      .select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    sendSuccessResponse(res, user, 'User profile retrieved successfully');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});