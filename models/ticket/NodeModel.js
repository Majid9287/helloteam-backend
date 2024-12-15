import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  ticket_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true 
  },
  tree_session_id: { type: String, required: true },
  node_id: { type: String, required: true },
  
  page_title: { type: String },
  question: { type: String },
  content: { type: String },
  keywords: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  buttons: [{
    button_text: { type: String },
    button_link: { type: String },
    button_type: { 
      type: String, 
      enum: ['true/false', 'yes/no', 'dropdown', 'checkbox', 'radio', 'list', 'text', 'number'], 
      default: 'text' 
    },
    options: { type: [String], default: [] } // For dropdown, list, radio, checkbox
  }],
  success_criteria: { type: String },
  
  // Tracking metadata
  timestamp: { type: Date, default: Date.now },
  sequence_order: { type: Number, default: 0 }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
nodeSchema.index({ ticket_id: 1, node_id: 1, tree_session_id: 1 });

export const Node = mongoose.model('Node', nodeSchema);