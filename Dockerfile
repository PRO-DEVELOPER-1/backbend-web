
# Stage 1: Build backend
FROM node:18-alpine as backend
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend ./backend

# Stage 2: Build frontend
FROM node:18-alpine as frontend
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

# Stage 3: Production image
FROM node:18-alpine
WORKDIR /app

# Copy backend
COPY --from=backend /app/backend ./backend

# Copy built frontend
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Install production dependencies (backend only)
RUN cd backend && npm install --production

# Install serve for frontend
RUN npm install -g serve

# Environment variables
ENV PORT=10000
ENV NODE_ENV=production

# Expose ports
EXPOSE 10000 3000

# Start both services using PM2
RUN npm install -g pm2
COPY ecosystem.config.js .
CMD ["pm2-runtime", "ecosystem.config.js"]
