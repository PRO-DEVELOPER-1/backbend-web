import { Server } from 'ssh2';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

export const startSFTP = () => {
  const server = new Server({
    hostKeys: [fs.readFileSync(path.join(process.cwd(), 'ssh_host_key'))],
  });

  server.on('connection', (client) => {
    client.on('authentication', (ctx) => {
      try {
        const decoded = jwt.verify(ctx.username, process.env.JWT_SECRET);
        ctx.accept();
      } catch (err) {
        ctx.reject();
      }
    });

    client.on('ready', () => {
      client.on('sftp', (accept) => {
        const sftp = accept();
        sftp.on('OPEN', (reqId, filename) => {
          const filePath = path.join(process.cwd(), 'bots', filename);
          sftp.handle(reqId, fs.createReadStream(filePath));
        });
      });
    });
  });

  server.listen(22, '0.0.0.0', () => {
    console.log('SFTP server running on port 22');
  });
};
