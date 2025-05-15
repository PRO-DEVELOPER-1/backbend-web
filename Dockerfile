# Stage 1: Frontend build
FROM node:18 as frontend-build

WORKDIR /app
# Copy only package.json first for better caching
COPY frontend/package.json ./frontend/
# Install without generating lock file
RUN cd frontend && npm install --no-package-lock && npm run build

# Stage 2: Backend setup
FROM node:18

WORKDIR /app

# Install backend without lock file
COPY backend/package.json ./backend/
RUN cd backend && npm install --no-package-lock

# Copy built frontend from first stage
COPY --from=frontend-build /app/frontend/build ./backend/public

# Copy backend source code
COPY backend ./backend

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "server.js"]
