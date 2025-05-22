import { useEffect, useRef } from 'react'

export default function Terminal({ botId }) {
  const terminalRef = useRef(null)

  useEffect(() => {
    // Simulate logs
    const interval = setInterval(() => {
      if (terminalRef.current) {
        terminalRef.current.textContent += `[${new Date().toLocaleTimeString()}] Bot ${botId} active\n`
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [botId])

  return (
    <div className="bg-black p-4 rounded-lg border border-neon-green h-64 overflow-auto">
      <pre ref={terminalRef} className="text-neon-green font-mono text-sm" />
    </div>
  )
}
