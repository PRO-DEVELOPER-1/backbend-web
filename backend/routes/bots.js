import express from "express";
import jwt from "jsonwebtoken";
import Bot from "../models/Bot.js";
import User from "../models/User.js";

const router = express.Router();

// Get all bots for a user
router.get("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("bots");
    res.json(user.bots);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Add a new bot
router.post("/", async (req, res) => {
  const { name, token } = req.body;
  const authToken = req.headers.authorization?.split(" ")[1];
  if (!authToken) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const bot = new Bot({ name, token, owner: decoded.id });
    await bot.save();

    const user = await User.findById(decoded.id);
    user.bots.push(bot._id);
    await user.save();

    res.status(201).json(bot);
  } catch (err) {
    res.status(400).json({ error: "Bot creation failed" });
  }
});

export default router;
