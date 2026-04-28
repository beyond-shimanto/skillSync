import express from "express";
import { authenticate } from "../server.js";
import { Skill, userModel } from "../models.js";

const skillRouter = express.Router();

skillRouter.get("/", async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch skills' });
  }
});

skillRouter.post("/seed", async (req, res) => {
  const defaultSkills = [
    { name: 'React', category: 'frontend' },
    { name: 'Node.js', category: 'backend' },
    { name: 'MongoDB', category: 'backend' },
    { name: 'Express', category: 'backend' },
    { name: 'JavaScript', category: 'frontend' },
    { name: 'TypeScript', category: 'frontend' },
    { name: 'Python', category: 'backend' },
    { name: 'Docker', category: 'devops' },
    { name: 'AWS', category: 'devops' },
    { name: 'Figma', category: 'design' },
    { name: 'SQL', category: 'data' },
    { name: 'Machine Learning', category: 'data' },
  ];

  try {
    await Skill.insertMany(defaultSkills, { ordered: false });
    res.json({ message: 'Skills seeded successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Some skills may already exist', error: err.message });
  }
});

// PUT /api/skills/save — saves skill tags for the logged-in user
skillRouter.put("/save", authenticate, async (req, res) => {
  const { skillsWanted, expertise } = req.body;

  try {
    const user = await userModel.findById(req.userObject.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (skillsWanted !== undefined) user.skillsWanted = skillsWanted;
    if (expertise !== undefined) user.expertise = expertise;

    await user.save();

    const updatedUser = await userModel
      .findById(req.userObject.userId)
      .populate('skillsWanted')
      .populate('expertise');

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update skills' });
  }
});

export { skillRouter };