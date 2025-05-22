module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "/app/backend",
      script: "server.js",
      env: {
        PORT: 10000,
        NODE_ENV: "production"
      }
    },
    {
      name: "frontend",
      cwd: "/app",
      script: "serve",
      args: "-s frontend/dist -l 3000",
      env: {
        PM2_SERVE_PORT: 3000
      }
    }
  ]
}
