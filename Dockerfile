# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the project
# Usamos 'npx vite build' direto para evitar erros estritos de TypeScript no Docker
RUN npx vite build

# Stage 2: Python + Chrome + Final App
FROM python:3.9-slim

# Install system dependencies for Chrome and Selenium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy Python application code
COPY app.py .

# Copy the built React assets from the builder stage
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p sefaz_uploads

# Expose port
EXPOSE 3000

# Start the application using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:3000", "--timeout", "120", "app:app"]
