module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://bera-backend.fly.dev/:path*'
      }
    ]
  }
}
