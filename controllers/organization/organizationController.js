
import { createOne, getAll, getOne, updateOne, deleteOne } from '../../factory/handleFactory.js';
import Organization from '../../models/organization/OrganizationModel.js';
import  { ticketSyncEmitter }  from '../../services/eventEmitter/index.js';
import catchAsync from '../../utils/catchAsync.js';
import { sendSuccessResponse, sendErrorResponse } from '../../utils/responseHandler.js';
import ZingtreeDataSyncService from '../../services/zingtree/index.js';
import User from '../../models/UserModel.js';

export const syncZingtreeTrees = catchAsync(async (req, res) => {
  try {
    const { organizationId, apiKey } = req.body;
    const zingtreeService = new ZingtreeDataSyncService(apiKey);
    const results = await zingtreeService.syncTreeData(organizationId);
    
    sendSuccessResponse(res, results, 'Trees synced successfully');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const register = catchAsync(async (req, res, next) => {
  try {
    const organization = await Organization.create({
      ...req.body,
      registeredBy: req.body.registeredBy||req.body.userId,
      syncStatus: 'pending'
    });

    await User.findByIdAndUpdate(
      req.body.registeredBy || req.body.userId,
      { organization: organization._id },
    );

    ticketSyncEmitter.emit('startSync', {
      organizationId: organization._id,
      apiKey: organization.apiKey
    });

    sendSuccessResponse(res, { organization }, 'Organization registered. Ticket sync started.');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

export const registerTickets = catchAsync(async (req, res, next) => {
  try {
    ticketSyncEmitter.emit('startSync', {
      organizationId: req.body.organizationId,
      apiKey: req.body.apiKey
    });

    sendSuccessResponse(res, null, 'Ticket sync started.');
  } catch (error) {
    sendErrorResponse(res, error);
  }
});

// Use factory handlers for other operations
export const getAllOrganizations = getAll(Organization);
export const getOrganization = getOne(Organization);
export const updateOrganization = updateOne(Organization);
export const deleteOrganization = deleteOne(Organization);