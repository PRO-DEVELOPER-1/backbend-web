export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:10000', // Matches backend PORT
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
