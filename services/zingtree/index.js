import axios from "axios";
import { Ticket } from "../../models/ticket/TicketModel.js";
import { Node } from "../../models/ticket/NodeModel.js";
import { SessionFormData } from "../../models/ticket/SessionFormData.js";
import { SessionNote } from "../../models/ticket/SessionNote.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/appError.js";
import mongoose from "mongoose";

class ZingtreeDataSyncService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://zingtree.com/api";
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: { "x-api-key": this.apiKey },
    });
  }

  async fetchAllTrees() {
    try {
      const response = await this.axiosInstance.get(
        `/tree/${this.apiKey}/get_trees`
      );
      return response.data.trees || [];
    } catch (error) {
      throw new AppError(`Failed to fetch trees: ${error.message}`, 500);
    }
  }

  async fetchTreeStructure(treeId) {
    try {
      const response = await this.axiosInstance.get(
        `/get_tree_structure/${this.apiKey}/${treeId}`
      );
      return response.data.tree || null;
    } catch (error) {
      console.error(`Failed to fetch tree structure for ${treeId}:`, error);
      return null;
    }
  }

  async fetchTreeSessions(treeId, startDate, endDate) {
    try {
      const response = await this.axiosInstance.get(
        `/tree_sessions/${this.apiKey}/${treeId}/${startDate}/${endDate}`
      );
      return response.data.sessions || [];
    } catch (error) {
      throw new AppError(
        `Failed to fetch tree sessions: ${error.message}`,
        500
      );
    }
  }

  async fetchSessionData(sessionId) {
    try {
      const response = await this.axiosInstance.get(
        `/session/${sessionId}/get_session_data`
      );
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch session data for ${sessionId}:`, error);
      return null;
    }
  }

  async fetchSessionNotes(sessionId) {
    try {
      const response = await this.axiosInstance.get(
        `/session/${sessionId}/get_session_notes`
      );
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch session notes for ${sessionId}:`, error);
      return null;
    }
  }

  async fetchFormData(sessionId) {
    try {
      const response = await this.axiosInstance.get(
        `/session/${sessionId}/get_form_data`
      );
      return response.data || null;
    } catch (error) {
      console.error(`Failed to fetch form data for ${sessionId}:`, error);
      return null;
    }
  }

  async syncTreeData(organizationId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const trees = await this.fetchAllTrees();
      const syncResults = await Promise.all(
        trees.map(async (tree) => {
          try {
            const treeStructure = await this.fetchTreeStructure(tree.tree_id);

            if (!treeStructure) {
              return {
                success: false,
                tree_id: tree.tree_id,
                error: "Failed to fetch tree structure",
              };
            }

            const ticketData = {
              tree_id: tree.tree_id,
              tree_name: tree.name,
              notes: tree.description,
              tags: tree.tags ? tree.tags.split(",") : [],
              organization: organizationId,
            };

            const ticket = await Ticket.findOneAndUpdate(
              { tree_id: tree.tree_id },
              ticketData,
              { upsert: true, new: true, session }
            );

            const nodeIds = [];
            const nodeDocuments = treeStructure.nodes.map((node) => {
              const nodeObjectId = new mongoose.Types.ObjectId(); // Generate new ObjectId
              nodeIds.push(nodeObjectId);
              return {
                _id: nodeObjectId,
                ticket_id: ticket._id,
                tree_session_id: treeStructure.tree_id,
                node_id: node.node_id,
                page_title: node.page_title,
                question: node.question,
                content: node.content,
                keywords: node.keywords ? node.keywords.split(",") : [],
                tags: node.tags ? node.tags.split(",") : [],
                buttons:
                  node.buttons?.map((button) => ({
                    button_text: button.button_text,
                    button_link: button.button_link,
                    button_type: this.detectButtonType(button),
                  })) || [],
              };
            });

            await Node.bulkWrite(
              nodeDocuments.map((nodeData) => ({
                updateOne: {
                  filter: {
                    ticket_id: ticket._id,
                    node_id: nodeData.node_id,
                    tree_session_id: treeStructure.tree_id,
                  },
                  update: nodeData,
                  upsert: true,
                },
              })),
              { session }
            );

            await Ticket.findByIdAndUpdate(
              ticket._id,
              { $set: { nodes: nodeIds } },
              { session }
            );

            return {
              success: true,
              tree_id: tree.tree_id,
              ticket_id: ticket._id,
              node_count: nodeDocuments.length,
            };
          } catch (error) {
            console.error(`Failed to process tree ${tree.tree_id}:`, error);
            return {
              success: false,
              tree_id: tree.tree_id,
              error: error.message,
            };
          }
        })
      );

      await session.commitTransaction();
      session.endSession();

      return {
        total: syncResults.length,
        succeeded: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
        details: syncResults,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(`Failed to sync tree data: ${error.message}`, 500);
    }
  }

  async syncSessionData(organizationId, startDate, endDate) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tickets = await Ticket.find({ organization: organizationId });

      const syncResults = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const sessions = await this.fetchTreeSessions(
              ticket.tree_id,
              startDate,
              endDate
            );

            const sessionResults = await Promise.all(
              sessions.map(async (sessionInfo) => {
                try {
                  const [sessionData, formData, notes] = await Promise.all([
                    this.fetchSessionData(sessionInfo.session_id),
                    this.fetchFormData(sessionInfo.session_id),
                    this.fetchSessionNotes(sessionInfo.session_id),
                  ]);

                  if (formData) {
                    await SessionFormData.findOneAndUpdate(
                      {
                        ticket_id: ticket._id,
                        session_id: sessionInfo.session_id,
                      },
                      {
                        form_data: formData,
                        source: sessionData?.source,
                        start_time: sessionData?.start_time_utc,
                        last_click_time: sessionData?.last_click_time_utc,
                        resolution_state: sessionInfo.resolution_state,
                        total_score: sessionInfo.total_score,
                        duration_seconds: sessionInfo.duration,
                        agent: sessionInfo.agent,
                      },
                      { upsert: true, new: true, session }
                    );
                  }

                  if (notes?.notes) {
                    await SessionNote.findOneAndUpdate(
                      {
                        ticket_id: ticket._id,
                        session_id: sessionInfo.session_id,
                      },
                      {
                        notes: notes.notes,
                        agent: sessionInfo.agent,
                      },
                      { upsert: true, new: true, session }
                    );
                  }

                  // Update ticket status based on latest session
                  if (sessionInfo.resolution_state) {
                    const status = this.mapResolutionStateToStatus(
                      sessionInfo.resolution_state
                    );
                    await Ticket.findByIdAndUpdate(
                      ticket._id,
                      { status },
                      { session }
                    );
                  }

                  return {
                    success: true,
                    session_id: sessionInfo.session_id,
                  };
                } catch (error) {
                  return {
                    success: false,
                    session_id: sessionInfo.session_id,
                    error: error.message,
                  };
                }
              })
            );

            return {
              success: true,
              tree_id: ticket.tree_id,
              ticket_id: ticket._id,
              sessions: sessionResults,
            };
          } catch (error) {
            return {
              success: false,
              tree_id: ticket.tree_id,
              error: error.message,
            };
          }
        })
      );

      await session.commitTransaction();
      session.endSession();

      return {
        total_tickets: syncResults.length,
        succeeded: syncResults.filter((r) => r.success).length,
        failed: syncResults.filter((r) => !r.success).length,
        details: syncResults,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new AppError(`Failed to sync session data: ${error.message}`, 500);
    }
  }

  detectButtonType(button) {
    const buttonText = button.button_text.toLowerCase();
    if (buttonText.match(/^(yes|no)$/)) return "yes/no";
    if (buttonText.match(/^(true|false)$/)) return "true/false";
    return "text";
  }

  mapResolutionStateToStatus(resolutionState) {
    const statusMap = {
      Y: "resolved",
      N: "in_progress",
      "?": "new",
    };
    return statusMap[resolutionState] || "new";
  }
}

export default ZingtreeDataSyncService;
