FROM node:18

# Create frontend structure
RUN mkdir -p /app/frontend/public && \
    mkdir -p /app/frontend/src && \
    echo 'console.log("Hello from generated React app")' > /app/frontend/src/index.js && \
    echo '{"name":"bera-frontend","version":"1.0.0","dependencies":{"react":"^18.2.0","react-dom":"^18.2.0","react-scripts":"5.0.1"}}' > /app/frontend/package.json && \
    echo '<!DOCTYPE html><html><head><title>Bera Hosting</title></head><body><div id="root"></div></body></html>' > /app/frontend/public/index.html

# Install and build frontend
WORKDIR /app/frontend
RUN npm install --no-package-lock && npm run build

# Setup backend
WORKDIR /app
COPY . .
RUN cd backend && npm install --no-package-lock
RUN mv frontend/build backend/public

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "server.js"]
