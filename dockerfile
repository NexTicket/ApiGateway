# Dockerfile for your expressjs-apigateway

# ---- Stage 1: Build ----
# This stage installs dependencies
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker's layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# ---- Stage 2: Production ----
# This stage creates the final, lean image
FROM node:18-alpine
WORKDIR /app

# Copy dependencies and source code from the 'builder' stage
COPY --from=builder /app .

# Expose the port the app runs on
EXPOSE 5000

# The command to start the application
# IMPORTANT: Change "server.js" if your entry file is named something else (e.g., index.js)
CMD [ "node", "server.js" ]