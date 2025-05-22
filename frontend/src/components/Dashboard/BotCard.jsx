export default function BotCard({ bot }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-neon-blue">
      <h3 className="text-xl font-bold text-neon-green">{bot.name}</h3>
      <p className="text-gray-400 mt-2">
        Status: <span className={bot.status === 'online' ? 'text-neon-green' : 'text-neon-pink'}>
          {bot.status}
        </span>
      </p>
      <div className="mt-4 flex space-x-2">
        <button className="px-3 py-1 bg-neon-blue text-black rounded hover:bg-neon-green transition">
          Start
        </button>
        <button className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition">
          Files
        </button>
      </div>
    </div>
  )
}
