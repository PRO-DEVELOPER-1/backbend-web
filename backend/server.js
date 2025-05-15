const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');
const simpleGit = require('simple-git');

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store for apps
const apps = new Map();

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for creating apps
app.post('/apps', async (req, res) => {
  const { appName, repoUrl } = req.body;

  // Validate inputs
  if (!appName || !repoUrl) {
    return res.status(400).json({ error: 'appName and repoUrl are required' });
  }

  if (apps.has(appName)) {
    return res.status(400).json({ error: 'App name already exists' });
  }

  try {
    const appPath = path.join(__dirname, 'apps', appName);
    await fs.ensureDir(appPath);

    // Clone repository
    await simpleGit().clone(repoUrl, appPath);

    // Detect app type and generate Dockerfile
    const { dockerfile, port } = await detectAppType(appPath);

    await fs.writeFile(path.join(appPath, 'Dockerfile'), dockerfile);

    // Build Docker image
    const stream = await docker.buildImage({
      context: appPath,
      src: ['Dockerfile', '.']
    }, { t: appName });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, output) => {
        if (err) return reject(err);
        resolve(output);
      });
    });

    // Run container
    const container = await docker.createContainer({
      Image: appName,
      name: appName,
      HostConfig: {
        PortBindings: { [`${port}/tcp`]: [{ HostPort: '0' }] }
      }
    });

    await container.start();

    // Store app info
    const containerInfo = await container.inspect();
    apps.set(appName, {
      containerId: containerInfo.Id,
      port: port,
      lastAccessed: Date.now()
    });

    // Set up inactivity timer
    const timer = setInterval(async () => {
      const fifteenMinutes = 15 * 60 * 1000;
      if (Date.now() - apps.get(appName).lastAccessed > fifteenMinutes) {
        await container.stop();
        await container.remove();
        apps.delete(appName);
        clearInterval(timer);
      }
    }, 60000); // Check every minute

    res.json({ 
      success: true, 
      message: `App deployed successfully! Access it at ${appName}.onrender.com`,
      appName
    });

  } catch (error) {
    console.error('Error deploying app:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to detect app type
async function detectAppType(appPath) {
  const hasPackageJson = await fs.pathExists(path.join(appPath, 'package.json'));
  const hasRequirements = await fs.pathExists(path.join(appPath, 'requirements.txt'));

  if (hasPackageJson) {
    return {
      dockerfile: `
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
`,
      port: 3000
    };
  } else if (hasRequirements) {
    return {
      dockerfile: `
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
`,
      port: 5000
    };
  } else {
    return {
      dockerfile: `
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
`,
      port: 80
    };
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
