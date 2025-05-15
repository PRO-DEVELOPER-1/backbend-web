require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');
const simpleGit = require('simple-git');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const docker = new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });
const git = simpleGit();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores
const apps = new Map(); // { appName: { containerId, port, lastAccessed, envVars } }
const userSessions = new Map(); // { sessionId: { githubToken } }

// Helper Functions
const detectAppType = async (appPath) => {
  const hasPackageJson = await fs.pathExists(path.join(appPath, 'package.json'));
  const hasRequirements = await fs.pathExists(path.join(appPath, 'requirements.txt'));

  if (hasPackageJson) {
    return {
      type: 'node',
      dockerfile: `FROM node:18
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
      port: 3000
    };
  } else if (hasRequirements) {
    return {
      type: 'python',
      dockerfile: `FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]`,
      port: 5000
    };
  }
  return {
    type: 'static',
    dockerfile: `FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80`,
    port: 80
  };
};

const deployApp = async (appName, repoUrl, branch = 'main', envVars = {}) => {
  const appPath = path.join(__dirname, 'apps', appName);
  
  // Clean existing app directory
  await fs.remove(appPath);
  await fs.ensureDir(appPath);

  // Clone repository
  await git.clone(repoUrl, appPath, ['-b', branch]);

  // Write .env file
  const envContent = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join('\n');
  await fs.writeFile(path.join(appPath, '.env'), envContent);

  // Detect app type and generate Dockerfile
  const { dockerfile, port, type } = await detectAppType(appPath);
  await fs.writeFile(path.join(appPath, 'Dockerfile'), dockerfile);

  // Build Docker image
  const stream = await docker.buildImage({
    context: appPath,
    src: ['Dockerfile', '.env', '.']
  }, { t: `${appName}:latest` });

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, output) => err ? reject(err) : resolve(output));
  });

  // Run container
  const container = await docker.createContainer({
    Image: `${appName}:latest`,
    name: appName,
    Env: Object.entries(envVars).map(([k, v]) => `${k}=${v}`),
    HostConfig: {
      PortBindings: { [`${port}/tcp`]: [{ HostPort: '0' }] }
    }
  });

  await container.start();

  // Store app info
  const containerInfo = await container.inspect();
  apps.set(appName, {
    containerId: containerInfo.Id,
    port,
    type,
    lastAccessed: Date.now(),
    envVars
  });

  // Setup auto-shutdown timer
  const timer = setInterval(async () => {
    const fifteenMinutes = 15 * 60 * 1000;
    const app = apps.get(appName);
    if (Date.now() - app.lastAccessed > fifteenMinutes) {
      await container.stop();
      await container.remove();
      apps.delete(appName);
      clearInterval(timer);
    }
  }, 60000);

  return { containerId: containerInfo.Id, port };
};

// Routes
app.get('/health', (req, res) => {
  docker.ping(err => {
    res.json({
      status: 'healthy',
      docker: !err,
      github: !!process.env.GITHUB_CLIENT_ID,
      apps: apps.size
    });
  });
});

// GitHub OAuth
app.get('/auth/github', (req, res) => {
  const state = crypto.randomBytes(8).toString('hex');
  userSessions.set(state, {});
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!userSessions.has(state)) return res.status(400).send('Invalid state');

  try {
    const { data } = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, { headers: { Accept: 'application/json' } });

    userSessions.get(state).githubToken = data.access_token;
    res.redirect('/?github_connected=1');
  } catch (err) {
    res.status(500).send('GitHub authentication failed');
  }
});

// GitHub Webhook
app.post('/api/github/webhook', async (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);
  
  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  if (sig !== digest) return res.status(401).send('Invalid signature');

  // Handle push event
  if (req.headers['x-github-event'] === 'push') {
    const { ref, repository } = req.body;
    if (ref === 'refs/heads/main') {
      const appName = repository.name;
      if (apps.has(appName)) {
        await deployApp(appName, repository.clone_url, 'main', apps.get(appName).envVars);
      }
    }
  }

  res.status(200).end();
});

// App Deployment
app.post('/api/apps', async (req, res) => {
  try {
    const { appName, repoUrl, branch, envVars } = req.body;
    
    if (!appName || !repoUrl) {
      return res.status(400).json({ error: 'appName and repoUrl are required' });
    }
    
    if (apps.has(appName)) {
      return res.status(400).json({ error: 'App name already exists' });
    }

    const { port } = await deployApp(appName, repoUrl, branch, envVars || {});
    res.json({ 
      success: true, 
      url: `${appName}.onrender.com`,
      port,
      appName
    });
  } catch (err) {
    console.error('Deployment error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get App Info
app.get('/api/apps/:name', (req, res) => {
  const app = apps.get(req.params.name);
  if (!app) return res.status(404).json({ error: 'App not found' });
  res.json(app);
});

// List Apps
app.get('/api/apps', (req, res) => {
  res.json(Array.from(apps.entries()).map(([name, details]) => ({
    name,
    type: details.type,
    url: `${name}.onrender.com`,
    createdAt: details.createdAt || new Date().toISOString()
  })));
});

// Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize
async function startServer() {
  try {
    await docker.ping();
    console.log('Connected to Docker daemon');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`GitHub OAuth enabled: ${!!process.env.GITHUB_CLIENT_ID}`);
    });
  } catch (err) {
    console.error('Failed to connect to Docker:', err);
    process.exit(1);
  }
}

startServer();
