import fs from 'fs';
import path from 'path';
import Bot from '../models/Bot.js';

export const uploadFile = async (req, res) => {
  const { botId } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const botDir = path.join(process.cwd(), 'bots', botId);
  if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });

  const filePath = path.join(botDir, file.originalname);
  fs.renameSync(file.path, filePath);

  await Bot.findByIdAndUpdate(botId, { $push: { files: filePath } });
  res.json({ message: 'File uploaded!' });
};

export const deleteFile = async (req, res) => {
  const { botId, filename } = req.params;
  const filePath = path.join(process.cwd(), 'bots', botId, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlinkSync(filePath);
  await Bot.findByIdAndUpdate(botId, { $pull: { files: filePath } });
  res.json({ message: 'File deleted' });
};
