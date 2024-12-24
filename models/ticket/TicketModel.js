import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    tree_id: { type: String, required: true },
    tree_name: { type: String },
    nodes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Node" }],
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "closed"],
      default: "new",
    },
    assigned_agent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assigned_supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Organizational reference
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
ticketSchema.index({ tree_id: 1 });

export const Ticket = mongoose.model("Ticket", ticketSchema);
