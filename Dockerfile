# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the application with a lightweight Node server
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install production dependencies (express)
COPY package*.json ./
RUN npm install --production

# Copy the server script
COPY server.js .

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
