# Stage 1: Frontend builder
FROM node:18 as frontend-builder

WORKDIR /app

# First create minimal package.json if missing
RUN mkdir -p frontend && \
    echo '{\
      "name": "bera-frontend",\
      "version": "1.0.0",\
      "scripts": {"build": "react-scripts build"},\
      "dependencies": {\
        "react": "^18.2.0",\
        "react-dom": "^18.2.0",\
        "react-scripts": "5.0.1"\
      }\
    }' > frontend/package.json

# Copy existing files (if any) - will override generated files
COPY frontend/package.json* ./frontend/

# Install dependencies
WORKDIR /app/frontend
RUN npm install --no-package-lock

# Copy remaining frontend files
COPY frontend ./

# Verify build script exists
RUN npm run build --dry-run || (echo "Build script missing!" && exit 1)

# Build frontend
RUN npm run build

# Stage 2: Backend
FROM node:18

WORKDIR /app

# Install backend dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install --no-package-lock

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./backend/public

# Copy backend source
COPY backend ./backend

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "server.js"]
