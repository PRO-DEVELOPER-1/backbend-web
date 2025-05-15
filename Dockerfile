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

# Optional: Check if build script exists
# RUN node -e "if (!require('./package.json').scripts.build) { console.error('Build script missing!'); process.exit(1); }"

# Build frontend
RUN npm run build
