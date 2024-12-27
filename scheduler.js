import cron from 'node-cron';
import Organization from './models/organization/OrganizationModel.js';
import ZingtreeDataSyncService from './services/zingtree/index.js';

// Function to sync data for a single organization
async function syncOrganizationData(organization) {
  console.log(`Starting sync for organization: ${organization.organizationName}`);
  const zingtreeService = new ZingtreeDataSyncService(organization.apiKey);
  
  try {
    await Organization.findByIdAndUpdate(organization._id, { syncStatus: 'syncing' });

    const treeResults = await zingtreeService.syncTreeData(organization._id);
    console.log('Tree sync completed:', treeResults);

    // Get the date range for session sync (last 24 hours)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sessionResults = await zingtreeService.syncSessionData(organization._id, startDate, endDate);
    console.log('Session sync completed:', sessionResults);

    await Organization.findByIdAndUpdate(organization._id, {
      syncStatus: 'completed',
      lastSyncAt: new Date(),
      syncResults: {
        trees: treeResults,
        sessions: sessionResults
      }
    });
  } catch (error) {
    console.error(`Sync failed for organization ${organization.organizationName}:`, error);
    await Organization.findByIdAndUpdate(organization._id, {
      syncStatus: 'failed',
      syncError: error.message
    });
  }
}

// Schedule the sync job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running Zingtree sync job...');
  const organizations = await Organization.find({});
  
  for (const organization of organizations) {
    await syncOrganizationData(organization);
  }
});

console.log('Zingtree sync scheduler started');

