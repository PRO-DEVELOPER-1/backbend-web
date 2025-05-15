# Stage 1: Build frontend
FROM node:18 AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend .
RUN npm run build

# Stage 2: Build backend
FROM node:18

WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install

# Copy built frontend from builder
COPY --from=frontend-builder /app/frontend/build ./backend/public
COPY backend ./backend

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "server.js"]
