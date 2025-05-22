import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Auth logic here
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <form 
        onSubmit={handleLogin}
        className="bg-gray-800 p-8 rounded-xl shadow-neon shadow-neon-purple w-96"
      >
        <h1 className="text-3xl text-neon-pink mb-6 text-center">Login</h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 bg-gray-700 rounded text-white"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 bg-gray-700 rounded text-white"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          <button
            type="submit"
            className="w-full py-2 bg-neon-purple text-black rounded hover:bg-neon-pink transition"
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  )
}
