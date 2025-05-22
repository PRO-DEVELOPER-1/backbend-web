import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Home() {
  const [gitUrl, setGitUrl] = useState('')
  const [apps, setApps] = useState([])

  useEffect(() => {
    axios.get('/api/apps').then(res => setApps(res.data))
  }, [])

  const deployApp = async () => {
    try {
      const { data } = await axios.post('/api/apps', { git_url: gitUrl })
      setApps([...apps, data])
    } catch (error) {
      alert(`Deployment failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  return (
    <div className="container">
      <h1>🚀 Bera Hosting</h1>
      
      <div className="deploy-box">
        <input
          type="text"
          placeholder="Git Repository URL"
          value={gitUrl}
          onChange={(e) => setGitUrl(e.target.value)}
        />
        <button onClick={deployApp}>Deploy Now</button>
      </div>

      <div className="app-grid">
        {apps.map(app => (
          <div key={app.id} className="app-card">
            <h3>{app.url}</h3>
            <div className="app-meta">
              <span>Status: {app.status}</span>
              <span>Buildpack: {app.buildpack}</span>
            </div>
            <a href={`/apps/${app.id}`} className="details-link">
              View Logs & Manage
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
