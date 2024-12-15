// services/ticketSyncService.js
import { ticketSyncEmitter } from './eventEmitter/index.js';
import ZingtreeDataSyncService from './zingtree/index.js';
import Organization from '../models/organization/OrganizationModel.js';

// Setup event listener
ticketSyncEmitter.on('startSync', async ({ organizationId, apiKey }) => {
  console.log(`StartSync event received for organization: ${organizationId}`);
  try {
    await Organization.findByIdAndUpdate(organizationId, { 
      syncStatus: 'syncing' 
    });

    const zingtreeService = new ZingtreeDataSyncService(apiKey);
    const results = await zingtreeService.syncTreeData(organizationId); // Corrected method name

    await Organization.findByIdAndUpdate(organizationId, {
      syncStatus: 'completed',
      lastSyncAt: new Date(),
      syncResults: results,
    });
  } catch (error) {
    console.error('Ticket sync failed:', error);
    await Organization.findByIdAndUpdate(organizationId, {
      syncStatus: 'failed',
      syncError: error.message,
    });
  }
});


export default ticketSyncEmitter;