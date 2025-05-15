// src/components/AppList.js
function AppList({ apps, onViewLogs }) {
  return (
    <div className="app-list">
      <h2>Deployed Apps</h2>
      <ul>
        {apps.map((app) => (
          <li key={app.name}>
            <strong>{app.name}</strong> —
            <button onClick={() => onViewLogs(app.name)} style={{ marginLeft: '1rem' }}>
              View Logs
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AppList;
