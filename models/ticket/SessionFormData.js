import mongoose from 'mongoose';

// Schema for storing session form data
const sessionFormDataSchema = new mongoose.Schema({
  ticket_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  session_id: {
    type: String,
    required: true
  },
  form_data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  source: {
    type: String
  },
  start_time: Date,
  last_click_time: Date,
  resolution_state: String,
  total_score: String,
  duration_seconds: Number,
  agent: String
}, {
  timestamps: true
});

sessionFormDataSchema.index({ ticket_id: 1, session_id: 1 });


export const SessionFormData = mongoose.model('SessionFormData', sessionFormDataSchema);
