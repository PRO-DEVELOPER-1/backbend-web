// src/components/LogsViewer.js
import { useEffect, useState } from 'react';

function LogsViewer({ appName, onClose }) {
  const [logs, setLogs] = useState('');

  useEffect(() => {
    const eventSource = new EventSource(`/api/apps/${appName}/logs`);

    eventSource.onmessage = (e) => {
      setLogs((prev) => prev + e.data + '\n');
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [appName]);

  return (
    <div className="log-viewer">
      <h3>Logs for {appName}</h3>
      <button onClick={onClose}>Close</button>
      <pre style={{ background: '#111', color: '#0f0', padding: '1rem', height: '300px', overflow: 'auto' }}>
        {logs || 'Waiting for logs...'}
      </pre>
    </div>
  );
}

export default LogsViewer;
