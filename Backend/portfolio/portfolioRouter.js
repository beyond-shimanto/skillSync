import express from 'express';
import { authenticate } from '../server.js';
import { portfolioModel } from './portfolioModel.js';

export const portfolioRouter = express.Router();

// Get all portfolios (public, but require auth for now)
portfolioRouter.get('/', authenticate, async (req, res) => {
    try {
        const portfolios = await portfolioModel.find().populate('userId', 'username').sort({ createdAt: -1 });
        res.status(200).json(portfolios);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get my portfolios
portfolioRouter.get('/my', authenticate, async (req, res) => {
    try {
        const portfolios = await portfolioModel.find({ userId: req.userObject.userId }).sort({ createdAt: -1 });
        res.status(200).json(portfolios);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});

// Create new portfolio
portfolioRouter.post('/', authenticate, async (req, res) => {
    const { title, description, url } = req.body;
    if (!title || !description || !url) {
        return res.status(400).json({ message: "Title, description, and URL are required" });
    }
    try {
        const newPortfolio = new portfolioModel({
            userId: req.userObject.userId,
            title,
            description,
            url
        });
        await newPortfolio.save();
        res.status(201).json(newPortfolio);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});

// Delete my portfolio
portfolioRouter.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const portfolio = await portfolioModel.findOne({ _id: id, userId: req.userObject.userId });
        if (!portfolio) {
            return res.status(404).json({ message: "Portfolio not found or not owned by you" });
        }
        await portfolioModel.deleteOne({ _id: id });
        res.status(200).json({ message: "Portfolio deleted" });
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
});