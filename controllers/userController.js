import User from '../models/UserModel.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccessResponse, sendErrorResponse } from '../utils/responseHandler.js';
import { createOne, getAll, getOne, updateOne, deleteOne } from '../factory/handleFactory.js';
import {sendEmail} from '../services/Email.js';
import APIFeatures from '../utils/apiFeatures.js';
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

export const getUsersByRole = catchAsync(async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const { organization } = req.params;

    if (!organization) {
      throw new Error('Organization ID is required');
    }

    // Base query
    let query = {
      role: role,
      organization: organization
    };

    // Add search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries
    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('organization')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);

    sendSuccessResponse(
      res, 
      {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers,
          limit: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      },
      `${role}s retrieved successfully`
    );

  } catch (error) {
    sendErrorResponse(res, error);
  }
});

// Update createUser to use catchAsync and response handlers
export const createUser = catchAsync(async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const { organization } = req.params;

    if (!['supervisor', 'agent'].includes(role)) {
      throw new Error('Invalid role. Must be supervisor or agent');
    }

    const user = new User({
      name,
      email,
      password,
      role,
      organization,
      greetedByRrganization: organization,
      greetedBy: req.user.id
    });

    await user.save();

    const emailSubject = 'Welcome to Our Platform';
    const emailText = `
      Hello ${name},
      Your account has been created successfully.
      Your login credentials:
      Email: ${email}
      Password: ${password}
      Please change your password after first login.
      Best regards,
      Your Platform Team
    `;

    await sendEmail(email, emailSubject, emailText);

    const userResponse = user.toObject();
    delete userResponse.password;

    sendSuccessResponse(
      res, 
      userResponse, 
      'User created successfully'
    );

  } catch (error) {
    sendErrorResponse(res, error);
  }
});