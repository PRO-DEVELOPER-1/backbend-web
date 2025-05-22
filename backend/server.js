const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bot" }],
});

const BotSchema = new mongoose.Schema({
  name: String,
  token: String,
  status: { type: String, default: "offline" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const User = mongoose.model("User", UserSchema);
const Bot = mongoose.model("Bot", BotSchema);

// Register User
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ message: "User registered!" });
});

// Login User
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

// Protected Route (Get User Bots)
app.get("/bots", async (req, res) => {
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

app.listen(5000, () => console.log("Server running on port 5000"));
