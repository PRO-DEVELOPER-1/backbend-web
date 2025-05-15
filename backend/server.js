const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const { PassThrough } = require('stream');
const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3000;

const activeLogStreams = new Map();
const apps = new Map();

// WebSocket log streaming
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { appName, type } = JSON.parse(message);
    if (type === 'build-logs' && activeLogStreams.has(appName)) {
      const stream = activeLogStreams.get(appName);
      stream.on('data', (chunk) => ws.send(chunk.toString()));
    }
  });
});

const detectAppType = async (appPath) => {
  if (await fs.pathExists(path.join(appPath, 'package.json'))) {
    return { type: 'node', start: 'node index.js', port: 3000 };
  }
  if (await fs.pathExists(path.join(appPath, 'main.py'))) {
    return { type: 'python', start: 'python3 main.py', port: 5000 };
  }
  throw new Error('Unsupported app type');
};

const deployApp = async (appName, repoUrl, branch = 'main', envVars = {}) => {
  const appPath = path.join(__dirname, 'apps', appName);
  const logStream = new PassThrough();
  activeLogStreams.set(appName, logStream);

  const log = (msg) => {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${msg}\n`;
    logStream.write(line);
    console.log(line.trim());
  };

  try {
    log(`Deploying ${appName}...`);
    await fs.remove(appPath);
    await fs.ensureDir(appPath);

    const git = simpleGit({ baseDir: appPath });
    await git.clone(repoUrl, '.', ['-b', branch]);
    log('Cloned repo');

    if (Object.keys(envVars).length) {
      await fs.writeFile(path.join(appPath, '.env'), Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n'));
      log('Wrote .env');
    }

    const { type, start, port } = await detectAppType(appPath);
    log(`Detected ${type} app`);

    const [cmd, ...args] = start.split(' ');
    const child = spawn(cmd, args, {
      cwd: appPath,
      env: { ...process.env, ...envVars },
    });

    child.stdout.on('data', (data) => logStream.write(data));
    child.stderr.on('data', (data) => logStream.write(data));
    child.on('exit', (code) => {
      log(`App ${appName} exited with code ${code}`);
      activeLogStreams.delete(appName);
    });

    apps.set(appName, {
      process: child,
      port,
      type,
      appPath,
      logStream,
    });

    log(`App running on port ${port}`);
    return { port };
  } catch (err) {
    log(`Error: ${err.message}`);
    activeLogStreams.delete(appName);
    throw err;
  }
};

app.use(express.json());

app.post('/api/deploy', async (req, res) => {
  const { appName, repoUrl, branch, envVars } = req.body;
  try {
    const result = await deployApp(appName, repoUrl, branch, envVars);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/apps/:name/logs', (req, res) => {
  const { name } = req.params;
  if (!activeLogStreams.has(name)) {
    return res.status(404).json({ error: 'No active logs' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const stream = activeLogStreams.get(name);
  stream.on('data', (chunk) => res.write(`data: ${chunk.toString().replace(/\n$/, '')}\n\n`));
  stream.on('end', () => res.end());

  req.on('close', () => {
    stream.removeAllListeners('data');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
