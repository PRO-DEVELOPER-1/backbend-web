import { useState } from 'react';

function AppForm({ onSubmit }) {
  const [appName, setAppName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ appName, repoUrl });
    setAppName('');
    setRepoUrl('');
  };

  return (
    <form onSubmit={handleSubmit} className="app-form">
      <h2>Deploy New App</h2>
      <div className="form-group">
        <label htmlFor="appName">App Name</label>
        <input
          type="text"
          id="appName"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="my-app"
          required
        />
        <small>This will be part of your subdomain (app-name.onrender.com)</small>
      </div>
      <div className="form-group">
        <label htmlFor="repoUrl">GitHub Repository URL</label>
        <input
          type="url"
          id="repoUrl"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/username/repo"
          required
        />
      </div>
      <button type="submit" className="submit-btn">
        Deploy App
      </button>
    </form>
  );
}

export default AppForm;
