require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// GitHub OAuth simulated callback (expand this with real OAuth if needed)
app.get('/auth/github/callback', (req, res) => {
  // Handle GitHub OAuth logic here
  res.redirect('/');
});

// Deploy a Node.js app
app.post('/deploy', (req, res) => {
  const { appName, zipFile } = req.body;
  if (!appName || !zipFile) {
    return res.status(400).json({ error: 'Missing appName or zipFile' });
  }

  const appPath = path.join(__dirname, '../deployed', appName);
  const zipPath = path.join(__dirname, '../uploads', zipFile);

  // Simulating extraction and deployment
  exec(`unzip ${zipPath} -d ${appPath}`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    // Optionally, run app start command after deployment
    exec(`cd ${appPath} && npm install && node ${appName}.js`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      res.json({ message: 'App deployed successfully' });
    });
  });
});

// Get app logs
app.get('/logs/:app', (req, res) => {
  const { app } = req.params;
  const logPath = path.join(__dirname, '../logs', `${app}.log`);
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Could not fetch logs' });
    res.send(data);
  });
});

// Delete an app
app.delete('/apps/:app', (req, res) => {
  const { app } = req.params;
  const appPath = path.join(__dirname, '../deployed', app);
  exec(`rm -rf ${appPath}`, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr });
    res.json({ message: 'App deleted successfully' });
  });
});

// Start/stop/restart an app
app.post('/apps/:app/:action', (req, res) => {
  const { app, action } = req.params;
  const validActions = ['start', 'stop', 'restart'];
  if (!validActions.includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const appPath = path.join(__dirname, '../deployed', app);
  if (action === 'start') {
    exec(`cd ${appPath} && node ${app}.js`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      res.json({ message: `App ${action}ed successfully` });
    });
  } else if (action === 'stop') {
    // Stop command logic (you may need a separate process manager like PM2 for this)
    res.json({ message: `App ${action}ped successfully` });
  } else if (action === 'restart') {
    exec(`cd ${appPath} && pm2 restart ${app}`, (err, stdout, stderr) => {
      if (err) return res.status(500).json({ error: stderr });
      res.json({ message: `App ${action}ed successfully` });
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
