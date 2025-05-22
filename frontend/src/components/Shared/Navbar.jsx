import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-gray-900 p-4 border-b border-neon-purple">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-neon-pink">
          Bera-Hosting
        </Link>
        <div className="space-x-4">
          <Link to="/login" className="text-neon-blue hover:text-neon-green">
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}
