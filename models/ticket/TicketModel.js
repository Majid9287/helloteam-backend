import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  session_id: { type: String, required: true, unique: true },
  tree_id: { type: String, required: true },
  tree_name: { type: String },
  
  // Source and context information
  source: { type: String },
  os: { type: String },
  browser: { type: String },
  ip: { type: String },
  
  // Timing information
  start_time: { type: Date },
  last_click_time: { type: Date },
  
  // Performance metrics
  total_score: { type: Number, default: 0 },
  result: { type: String, enum: ['Y', 'N', '?'], default: '?' },
  time_spent: { type: String },
  duration_seconds: { type: Number },
  
  // References to related documents
  nodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Node' }],
  
  // Form data as flexible key-value pairs
  form_data: [{
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
    type: { 
      type: String, 
      enum: ['text', 'number', 'email', 'date', 'boolean', 'select', 'multiselect'],
      default: 'text'
    }
  }],

  // Path tracking as flexible array
  path: [{
    question: { type: String },
    page_title: { type: String },
    subtree: { type: String },
    from_node_id: { type: String },
    to_node_id: { type: String },
    source: { type: String },
    seq: { type: Number },
    time: { type: String },
    seconds: { type: Number },
    button_text: { type: String }
  }],
  
  notes: { type: String },
  
  // Ticket management
  status: { 
    type: String, 
    enum: ['new', 'in_progress', 'resolved', 'closed'], 
    default: 'new' 
  },
  assigned_agent:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  assigned_supervisor:{ type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  
  // Organizational reference
  organization: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  
  // Timestamps
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ticketSchema.index({ session_id: 1, tree_id: 1 });

export  const Ticket = mongoose.model('Ticket', ticketSchema);

