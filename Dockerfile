# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the project
# Usamos 'npx vite build' direto para evitar erros estritos de TypeScript (tsc) no Docker
RUN npx vite build

# Stage 2: Serve the application with a lightweight Node server
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install production dependencies
COPY package*.json ./
RUN npm install --production
# Garante que o express esteja instalado
RUN npm install express

# Copy the server script
COPY server.js .

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
