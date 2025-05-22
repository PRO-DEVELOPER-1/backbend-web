import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function AppDetails() {
  const router = useRouter()
  const { id } = router.query
  const [logs, setLogs] = useState('')

  useEffect(() => {
    if (!id) return
    
    const ws = new WebSocket(`wss://bera-backend.fly.dev/apps/${id}/logs`)
    ws.onmessage = (e) => setLogs(prev => prev + e.data)
    
    return () => ws.close()
  }, [id])

  return (
    <div className="log-viewer">
      <h2>App Logs</h2>
      <pre>{logs}</pre>
    </div>
  )
}
