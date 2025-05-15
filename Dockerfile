# Stage 1: Frontend builder
FROM node:18 as frontend-builder

WORKDIR /app/frontend

# Copy full frontend package files (package.json + package-lock.json if present)
COPY frontend/package.json frontend/package-lock.json* ./

# Install frontend dependencies (including axios and react-scripts)
RUN npm install --no-package-lock

# Copy the rest of the frontend source code
COPY frontend ./

# Build the React frontend
RUN npm run build


# Stage 2: Backend
FROM node:18

WORKDIR /app/backend

# Copy backend package files
COPY backend/package.json backend/package-lock.json* ./

# Install backend dependencies
RUN npm install --no-package-lock

# Copy backend source code
COPY backend ./

# Copy built frontend from frontend-builder stage into backend/public
COPY --from=frontend-builder /app/frontend/build ./public

EXPOSE 3000

CMD ["node", "server.js"]
