import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bot" }],
});

export default mongoose.model("User", UserSchema);
```

#### **`models/Bot.js`**
```javascript
import mongoose from "mongoose";

const BotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token: { type: String, required: true },
  status: { type: String, default: "offline" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

export default mongoose.model("Bot", BotSchema);
