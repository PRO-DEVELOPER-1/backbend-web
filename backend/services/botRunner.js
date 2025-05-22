import { spawn } from 'child_process';
import Bot from '../models/Bot.js';
import fs from 'fs';
import path from 'path';

export const startBot = async (botId) => {
  const bot = await Bot.findById(botId);
  if (!bot) throw new Error('Bot not found');

  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logFile = path.join(logDir, `bot_${botId}.log`);
  fs.writeFileSync(logFile, ''); // Clear old logs

  const botDir = path.join(process.cwd(), 'bots', botId);
  if (!fs.existsSync(botDir)) fs.mkdirSync(botDir, { recursive: true });

  const process = spawn('node', [path.join(botDir, 'main.js')], {
    detached: true,
    stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
  });

  bot.status = 'online';
  bot.pid = process.pid;
  bot.logFile = logFile;
  await bot.save();

  process.on('exit', () => updateBotStatus(botId, 'offline'));
};

export const stopBot = async (botId) => {
  const bot = await Bot.findById(botId);
  if (!bot?.pid) return;

  try {
    process.kill(bot.pid);
    bot.status = 'offline';
    await bot.save();
  } catch (err) {
    bot.status = 'crashed';
    await bot.save();
  }
};
