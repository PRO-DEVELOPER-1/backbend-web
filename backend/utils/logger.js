import fs from 'fs';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logStream = fs.createWriteStream(
  path.join(logDir, `error_${new Date().toISOString().split('T')[0]}.log`),
  { flags: 'a' }
);

export const logError = (error) => {
  const timestamp = new Date().toISOString();
  logStream.write(`${timestamp} - ${error.stack}\n`);
};
