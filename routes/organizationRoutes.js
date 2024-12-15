import express from 'express';
import { 
  register,
  getAllOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization ,
  syncZingtreeTrees,
  registerTickets
} from '../controllers/organization/organizationController.js';
// import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
// router.use(protect);

router.post('/TriggerticketSyncEmitter',  registerTickets);
router.post('/syncZingtree',  syncZingtreeTrees);
router.post('/register', register);
router.get('/', getAllOrganizations);
router.get('/:id', getOrganization);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export default router;