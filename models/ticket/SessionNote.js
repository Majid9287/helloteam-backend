import mongoose from 'mongoose';

// Schema for storing session notes
const sessionNoteSchema = new mongoose.Schema({
  ticket_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  session_id: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  agent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

sessionNoteSchema.index({ ticket_id: 1, session_id: 1 });
export const SessionNote = mongoose.model('SessionNote', sessionNoteSchema);