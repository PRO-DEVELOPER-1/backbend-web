import { useState } from 'react'

export default function FileExplorer({ botId }) {
  const [files, setFiles] = useState([
    'main.js',
    'package.json',
    'config.json'
  ])

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-neon-purple">
      <h3 className="text-xl font-bold text-neon-blue mb-4">Files</h3>
      <ul className="space-y-2">
        {files.map((file, index) => (
          <li key={index} className="flex justify-between items-center">
            <span className="text-gray-300">{file}</span>
            <button className="text-neon-pink hover:text-neon-red">
              Delete
            </button>
          </li>
        ))}
      </ul>
      <input
        type="file"
        className="mt-4"
      />
    </div>
  )
}
