import axios from "axios";
import { Ticket } from "../../models/ticket/TicketModel.js";
import { Node } from "../../models/ticket/NodeModel.js";
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

  async syncTreeData(organizationId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch all trees
      const trees = await this.fetchAllTrees();

      // 2. Process each tree
      const syncResults = await Promise.all(
        trees.map(async (tree) => {
          try {
            // Fetch detailed tree structure
            const treeStructure = await this.fetchTreeStructure(tree.tree_id);

            if (!treeStructure) {
              return {
                success: false,
                tree_id: tree.tree_id,
                error: "Failed to fetch tree structure",
              };
            }

            // Save ticket (representing the tree)
            const ticketData = {
              session_id: tree.tree_id,
              tree_id: tree.tree_id,
              tree_name: tree.name,
              notes: tree.description,
              tags: tree.tags ? tree.tags.split(",") : [],
              organization: organizationId,
            };

            const ticket = await Ticket.findOneAndUpdate(
              { session_id: tree.tree_id },
              ticketData,
              { upsert: true, new: true, session }
            );

            // Save nodes and collect node IDs
            const nodeIds = [];
            const nodeDocuments = treeStructure.nodes.map((node) => {
              nodeIds.push(node.node_id);
              return {
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

            // Bulk write nodes
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

            // Update ticket with node IDs
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

  detectButtonType(button) {
    const buttonText = button.button_text.toLowerCase();
    if (buttonText.match(/^(yes|no)$/)) return "yes/no";
    if (buttonText.match(/^(true|false)$/)) return "true/false";
    return "text";
  }
}

export default ZingtreeDataSyncService;