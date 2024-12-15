import mongoose from 'mongoose';
import crypto from 'crypto';

const organizationSchema = new mongoose.Schema({
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organizationName: {
    type: String,
    required: true,
    unique: true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  logo: String,
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'completed', 'failed'],
    default: 'pending'
  },
  lastSyncAt: Date,
  syncResults: {
    total: Number,
    succeeded: Number,
    failed: Number
  },
  syncError: String,
  agents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  tickets: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});


const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;