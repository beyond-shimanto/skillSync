import express from "express";
import { authenticate } from "../server.js";
import { bookmarkModel, userModel } from "../models.js";

export const bookmarkRouter = express.Router();

// Bookmark a mentor (for students only)
bookmarkRouter.post("/mentor", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const { mentorUserId, mentorUsername } = req.body;

    if (!mentorUserId) {
      return res.status(400).json({ error: "mentorUserId is required" });
    }

    // Only students can bookmark mentors
    const user = await userModel.findById(userId).select("userType");
    if (user.userType !== "student") {
      return res.status(403).json({ error: "Only students can bookmark mentors" });
    }

    // Check if already bookmarked
    const existing = await bookmarkModel.findOne({ userId, type: "mentor", mentorUserId });
    if (existing) {
      return res.status(400).json({ error: "Already bookmarked" });
    }

    const bookmark = new bookmarkModel({
      userId,
      type: "mentor",
      mentorUserId,
      mentorUsername: mentorUsername || ""
    });

    await bookmark.save();
    res.status(200).json({ message: "Mentor bookmarked", bookmark });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Bookmarking a resource for both students and mentors
bookmarkRouter.post("/resource", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const { resourceId, resourceTitle, resourceGroupId } = req.body;

    if (!resourceId) {
      return res.status(400).json({ error: "resourceId is required" });
    }

    // Checking if already bookmarked
    const existing = await bookmarkModel.findOne({ userId, type: "resource", resourceId });
    if (existing) {
      return res.status(400).json({ error: "Already bookmarked" });
    }

    const bookmark = new bookmarkModel({
      userId,
      type: "resource",
      resourceId,
      resourceTitle: resourceTitle || "",
      resourceGroupId: resourceGroupId || null
    });

    await bookmark.save();
    res.status(200).json({ message: "Resource bookmarked", bookmark });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//Remove a bookmark
bookmarkRouter.delete("/:bookmarkId", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const { bookmarkId } = req.params;

    const bookmark = await bookmarkModel.findOne({ _id: bookmarkId, userId });
    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    await bookmarkModel.findOneAndDelete({ _id: bookmarkId });
    res.status(200).json({ message: "Bookmark removed" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all bookmarks for logged in user
bookmarkRouter.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const bookmarks = await bookmarkModel
      .find({ userId })
      .sort({ createdAt: -1 });

    res.status(200).json(bookmarks);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

//Checking if a mentor is bookmarked
bookmarkRouter.get("/check/mentor/:mentorUserId", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const { mentorUserId } = req.params;
    const bookmark = await bookmarkModel.findOne({ userId, type: "mentor", mentorUserId });
    res.status(200).json({ bookmarked: !!bookmark, bookmarkId: bookmark?._id || null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Checking if a resource is bookmarked
bookmarkRouter.get("/check/resource/:resourceId", authenticate, async (req, res) => {
  try {
    const userId = req.userObject.userId;
    const { resourceId } = req.params;
    const bookmark = await bookmarkModel.findOne({ userId, type: "resource", resourceId });
    res.status(200).json({ bookmarked: !!bookmark, bookmarkId: bookmark?._id || null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});