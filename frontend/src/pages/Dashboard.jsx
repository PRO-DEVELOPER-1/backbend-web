import { useState } from 'react'
import BotCard from '../components/Dashboard/BotCard'
import FileExplorer from '../components/Dashboard/FileExplorer'
import Terminal from '../components/Dashboard/Terminal'

export default function Dashboard() {
  const [bots, setBots] = useState([
    { id: 1, name: 'Music Bot', status: 'online' },
    { id: 2, name: 'Moderation Bot', status: 'offline' }
  ])
  const [selectedBot, setSelectedBot] = useState(null)

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-neon-pink mb-8">Your Bots</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {bots.map(bot => (
            <BotCard 
              key={bot.id} 
              bot={bot} 
              onClick={() => setSelectedBot(bot)}
            />
          ))}
        </div>

        {selectedBot && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileExplorer botId={selectedBot.id} />
            <Terminal botId={selectedBot.id} />
          </div>
        )}
      </div>
    </div>
  )
}
