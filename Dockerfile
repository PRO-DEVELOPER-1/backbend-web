# Root Dockerfile
FROM node:18

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install

# Install frontend dependencies
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install

# Copy all files
COPY . .

# Build frontend
RUN cd frontend && npm run build && \
    mkdir -p backend/public && \
    cp -r build/* backend/public/

WORKDIR /app/backend

EXPOSE 3000
CMD ["node", "server.js"]
