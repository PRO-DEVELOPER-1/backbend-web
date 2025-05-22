# Stage 1: Build backend
FROM node:18-alpine as backend
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install --legacy-peer-deps
COPY backend ./backend

# Stage 2: Build frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install --legacy-peer-deps
COPY frontend ./frontend
# Fix for potential build issues
RUN cd frontend && \
    npm install -g vite && \
    npm run build || { echo "Build failed - checking cache"; exit 1; }

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install only production backend deps
RUN cd backend && npm ci --only=production

# Install serve globally
RUN npm install -g serve

# Environment variables
ENV PORT=10000
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:10000/api/health || exit 1

# Start commands
CMD ["sh", "-c", "cd backend && node server.js & serve -s frontend/dist -l 3000"]
