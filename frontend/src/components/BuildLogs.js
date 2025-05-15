import { useState, useEffect } from 'react';

export default function BuildLogs({ appName }) {
  const [logs, setLogs] = useState([]);
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // WebSocket connection
    const socket = new WebSocket(`ws://${window.location.host}`);
    
    socket.onopen = () => {
      setConnected(true);
      socket.send(JSON.stringify({ 
        appName, 
        type: 'build-logs' 
      }));
    };

    socket.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    socket.onclose = () => setConnected(false);

    setWs(socket);

    // SSE fallback
    const eventSource = new EventSource(`/api/apps/${appName}/logs`);
    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    return () => {
      socket.close();
      eventSource.close();
    };
  }, [appName]);

  return (
    <div className="build-logs">
      <div className="logs-header">
        <h3>Build Logs: {appName}</h3>
        <span className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Live' : '○ Disconnected'}
        </span>
      </div>
      <div className="logs-container">
        {logs.map((log, i) => (
          <div key={i} className="log-line">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
