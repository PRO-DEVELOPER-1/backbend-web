require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// Simulated GitHub OAuth callback (you can expand this with passport-github)
app.get('/auth/github/callback', (req, res) => {
  // In a real app, you'd handle OAuth logic here
  res.redirect('/');
});

// Deploy a new app using Dokku and a GitHub repo URL
app.post('/deploy', (req, res) => {
  const { repoUrl, appName } = req.body;

  if (!repoUrl || !appName) {
    return res.status(400).json({ error: 'Missing repoUrl or appName' });
  }

  const createCommand = `dokku apps:create ${appName}`;
  const deployCommand = `dokku git:from-repo ${appName} ${repoUrl}`;

  exec(`${createCommand} && ${deployCommand}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: stdout });
  });
});

// Stream real-time logs
app.get('/logs/:app', (req, res) => {
  const { app } = req.params;
  const logStream = spawn('dokku', ['logs', app, '-t']);

  res.setHeader('Content-Type', 'text/plain');

  logStream.stdout.pipe(res);
  logStream.stderr.pipe(res);

  req.on('close', () => {
    logStream.kill();
  });
});

// Delete an app
app.delete('/apps/:app', (req, res) => {
  const { app } = req.params;

  exec(`dokku apps:destroy ${app} --force`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: stdout });
  });
});

// Get environment variables for an app
app.get('/env/:app', (req, res) => {
  const { app } = req.params;

  exec(`dokku config ${app}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ config: stdout });
  });
});

// Set a new environment variable
app.post('/env/:app', (req, res) => {
  const { app } = req.params;
  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: 'Missing key or value' });
  }

  exec(`dokku config:set ${app} ${key}='${value}'`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: stdout });
  });
});

// Process control: start, stop, restart
app.post('/apps/:app/:action', (req, res) => {
  const { app, action } = req.params;

  const validActions = ['start', 'stop', 'restart'];
  if (!validActions.includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  exec(`dokku ps:${action} ${app}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ error: stderr });
    }
    res.json({ message: stdout });
  });
});

// Start backend server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
