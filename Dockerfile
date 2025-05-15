# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files separately to leverage Docker cache
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
RUN cd backend && npm install

# Install frontend dependencies
RUN cd frontend && npm install

# Copy all source files
COPY . .

# Build frontend
RUN cd frontend && npm run build && \
    mkdir -p ../backend/public && \
    cp -r build/* ../backend/public/

# Set working directory to backend
WORKDIR /app/backend

# Expose port and start server
EXPOSE 3000
CMD ["node", "server.js"]
