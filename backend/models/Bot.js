import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true },
  status: { type: String, default: "offline" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Bot", BotSchema);
