import Bot from '../models/Bot.js';
import { startBot, stopBot } from '../services/botRunner.js';

export const getBots = async (req, res) => {
  const bots = await Bot.find({ owner: req.user.id });
  res.json(bots);
};

export const createBot = async (req, res) => {
  const { name, token } = req.body;
  const bot = new Bot({ name, token, owner: req.user.id });
  await bot.save();

  // Add bot to user's bots array
  await User.findByIdAndUpdate(req.user.id, { $push: { bots: bot._id } });

  res.status(201).json(bot);
};

export const toggleBot = async (req, res) => {
  const { botId } = req.params;
  const bot = await Bot.findById(botId);

  if (bot.status === 'online') {
    await stopBot(botId);
  } else {
    await startBot(botId);
  }

  res.json({ message: 'Bot status updated' });
};
