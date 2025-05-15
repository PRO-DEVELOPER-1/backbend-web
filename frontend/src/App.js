// src/App.js
import { useState } from 'react';
import axios from 'axios';
import './App.css';
import AppForm from './components/AppForm';
import AppList from './components/AppList';
import LogsViewer from './components/LogsViewer';

function App() {
  const [apps, setApps] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedApp, setSelectedApp] = useState(null);

  const handleDeploy = async ({ appName, repoUrl }) => {
    try {
      const res = await axios.post('/api/deploy', { appName, repoUrl });
      setMessage({ text: `App deployed on port ${res.data.port}`, type: 'success' });
      setApps((prev) => [...prev, { name: appName }]);
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to deploy app', type: 'error' });
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Bera Hosting</h1>
        <p>Deploy your Node.js, Python, or static apps with ease</p>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <main>
        <AppForm onDeploy={handleDeploy} />
        <AppList apps={apps} onViewLogs={setSelectedApp} />
        {selectedApp && (
          <LogsViewer appName={selectedApp} onClose={() => setSelectedApp(null)} />
        )}
      </main>

      <footer>
        <p>Free Platform-as-a-Service | No authentication required</p>
      </footer>
    </div>
  );
}

export default App;
