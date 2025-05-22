export default defineConfig({
  base: '/', // Change to your subpath if needed
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true
      }
    }
  }
})
