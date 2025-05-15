require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const simpleGit = require('simple-git');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores
const apps = new Map(); // { appName: { process, port, type, lastAccessed } }
const portPool = new Set();
const usedPorts = new Set();

// Initialize port pool (3001-4000)
for (let i = 3001; i <= 4000; i++) {
  portPool.add(i);
}

// Helper Functions
const getAvailablePort = () => {
  if (portPool.size === 0) throw new Error('No available ports');
  const port = portPool.values().next().value;
  portPool.delete(port);
  usedPorts.add(port);
  return port;
};

const releasePort = (port) => {
  usedPorts.delete(port);
  portPool.add(port);
};

const detectAppType = async (appPath) => {
  const hasPackageJson = await fs.pathExists(path.join(appPath, 'package.json'));
  const hasRequirements = await fs.pathExists(path.join(appPath, 'requirements.txt'));

  if (hasPackageJson) {
    return { type: 'node', command: 'npm', args: ['start'] };
  } else if (hasRequirements) {
    return { type: 'python', command: 'python', args: ['app.py'] };
  }
  return { type: 'static', command: 'serve', args: ['-s', '.', '-p'] };
};

// Process Management
const startAppProcess = async (appName, appPath, port, envVars = {}) => {
  const { type, command, args } = await detectAppType(appPath);
  
  // Install dependencies if needed
  if (type === 'node') {
    await new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], { 
        cwd: appPath,
        stdio: 'inherit'
      });
      npmInstall.on('close', (code) => 
        code === 0 ? resolve() : reject(new Error(`npm install failed with code ${code}`))
      );
    });
  } else if (type === 'python') {
    await new Promise((resolve, reject) => {
      const pipInstall = spawn('pip', ['install', '-r', 'requirements.txt'], { 
        cwd: appPath,
        stdio: 'inherit'
      });
      pipInstall.on('close', (code) => 
        code === 0 ? resolve() : reject(new Error(`pip install failed with code ${code}`))
      );
    });
  }

  // Start the application
  const finalArgs = type === 'static' ? [...args, port.toString()] : args;
  const appProcess = spawn(command, finalArgs, {
    cwd: appPath,
    env: { ...process.env, ...envVars, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Store output streams
  const logs = { stdout: '', stderr: '' };
  appProcess.stdout.on('data', (data) => {
    logs.stdout += data.toString();
    console.log(`[${appName}] ${data}`);
  });
  appProcess.stderr.on('data', (data) => {
    logs.stderr += data.toString();
    console.error(`[${appName}] ${data}`);
  });

  appProcess.on('exit', (code) => {
    console.log(`[${appName}] Process exited with code ${code}`);
    releasePort(port);
    apps.delete(appName);
  });

  return { 
    process: appProcess, 
    port,
    type,
    logs,
    lastAccessed: Date.now()
  };
};

// WebSocket Server for Logs
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const { appName } = JSON.parse(message);
    if (apps.has(appName)) {
      const app = apps.get(appName);
      ws.send(JSON.stringify({ type: 'logs', data: app.logs.stdout }));
    }
  });
});

// API Endpoints
app.post('/api/apps', async (req, res) => {
  const { appName, repoUrl, branch = 'main', envVars = {} } = req.body;

  try {
    if (!appName || !repoUrl) {
      return res.status(400).json({ error: 'appName and repoUrl are required' });
    }

    if (apps.has(appName)) {
      return res.status(400).json({ error: 'App name already exists' });
    }

    const appPath = path.join(__dirname, 'apps', appName);
    await fs.ensureDir(appPath);
    await fs.emptyDir(appPath);

    // Clone repository
    await simpleGit().clone(repoUrl, appPath, ['-b', branch]);

    // Write .env file
    if (Object.keys(envVars).length > 0) {
      await fs.writeFile(
        path.join(appPath, '.env'),
        Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n')
      );
    }

    // Start application
    const port = getAvailablePort();
    const appProcess = await startAppProcess(appName, appPath, port, envVars);
    apps.set(appName, appProcess);

    res.json({ 
      success: true, 
      url: `${HOST}:${port}`,
      appName,
      port
    });

  } catch (err) {
    console.error('Deployment error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/apps/:name', (req, res) => {
  const { name } = req.params;
  if (!apps.has(name)) {
    return res.status(404).json({ error: 'App not found' });
  }

  const app = apps.get(name);
  app.process.kill();
  apps.delete(name);
  releasePort(app.port);

  res.json({ success: true });
});

app.get('/api/apps', (req, res) => {
  res.json(Array.from(apps.entries()).map(([name, details]) => ({
    name,
    type: details.type,
    url: `${HOST}:${details.port}`,
    status: details.process.exitCode === null ? 'running' : 'stopped'
  })));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    runningApps: apps.size,
    availablePorts: portPool.size
  });
});

// Start Server
server.listen(PORT, HOST, () => {
  console.log(`Bera Hosting running on http://${HOST}:${PORT}`);
});
