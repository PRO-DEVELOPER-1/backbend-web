import { useState } from 'react';
import axios from 'axios';

export default function GitHubConnect() {
  const [isConnected, setIsConnected] = useState(false);
  
  const handleConnect = () => {
    window.location.href = '/auth/github';
  };
  
  return (
    <div className="github-connect">
      <h3>GitHub Integration</h3>
      {isConnected ? (
        <div className="connected">✓ Connected</div>
      ) : (
        <button onClick={handleConnect}>Connect GitHub</button>
      )}
    </div>
  );
}
