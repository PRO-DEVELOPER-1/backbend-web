function AppList({ apps }) {
  if (apps.length === 0) return null;

  return (
    <div className="app-list">
      <h2>Your Deployed Apps</h2>
      <ul>
        {apps.map((app, index) => (
          <li key={index}>
            <a 
              href={`https://${app.name}.onrender.com`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {app.name}.onrender.com
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AppList;
