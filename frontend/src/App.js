import { useState } from 'react';
import axios from 'axios';
import './App.css';
import AppForm from './components/AppForm';
import AppList from './components/AppList';

function App() {
  const [apps, setApps] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (appData) => {
    try {
      const response = await axios.post('/apps', appData);
      setMessage({ text: response.data.message, type: 'success' });
      setApps([...apps, { name: appData.appName, url: response.data.appName }]);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.error || 'Failed to deploy app', 
        type: 'error' 
      });
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
        <AppForm onSubmit={handleSubmit} />
        <AppList apps={apps} />
      </main>

      <footer>
        <p>Free Platform-as-a-Service | No authentication required</p>
      </footer>
    </div>
  );
}

export default App;
