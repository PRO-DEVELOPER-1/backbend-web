# Stage 1: Frontend build
FROM node:18 as frontend-build

WORKDIR /app

# First copy only package files for better caching
COPY frontend/package.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm install --no-package-lock

# Copy ALL frontend files (including public folder)
COPY frontend ./frontend

# Build the frontend
RUN cd frontend && npm run build

# Stage 2: Backend setup
FROM node:18

WORKDIR /app

# Install backend dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install --no-package-lock

# Copy built frontend from first stage
COPY --from=frontend-build /app/frontend/build ./backend/public

# Copy backend source code
COPY backend ./backend

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "server.js"]
