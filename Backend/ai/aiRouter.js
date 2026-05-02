import express from "express";
import { generateAIResponse, generateRoadmap } from "./aiService.js";
import { authenticate } from "../server.js";
import { userModel } from "../models.js";

export const aiRouter = express.Router();

// POST endpoint to chat with AI
aiRouter.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Messages array is required and cannot be empty",
      });
    }

    const result = await generateAIResponse(messages);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in AI chat route:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST endpoint to generate a learning roadmap
aiRouter.post("/roadmap", authenticate, async (req, res) => {
  try {
    const { targetRole } = req.body;

    if (!targetRole || !targetRole.trim()) {
      return res.status(400).json({
        success: false,
        error: "targetRole is required",
      });
    }

    // Fetching user's existing skills to personalize
    const user = await userModel
      .findById(req.userObject.userId)
      .populate("skillsWanted");

    const skills = user?.skillsWanted?.map(s => s.name) ?? [];

    const result = await generateRoadmap(targetRole.trim(), skills);

    if (result.success) {
      return res.status(200).json({
        success: true,
        roadmap: result.roadmap,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in roadmap route:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// GET endpoint for health check
aiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "AI service is running" });
});
