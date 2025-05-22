import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true },
  status: { type: String, enum: ["online", "offline", "crashed"], default: "offline" },
  pid: { type: Number },       // Process ID
  logFile: { type: String },   // Path to logs
  files: [{ type: String }],   // Stored files
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Bot", BotSchema);
