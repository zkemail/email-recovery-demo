# Stage 1: Build the application
FROM node:22-alpine AS build

# Set the working directory
WORKDIR /app

# Copy the package.json and yarn.lock files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --network-timeout=500000

# Copy the rest of the application code
COPY . .

# Build the frontend (Vite build process)
RUN yarn build

# Stage 2: Serve the application
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy the built app from the build stage
COPY --from=build /app /app

# Expose the port your server is listening on
EXPOSE 80

# Start the Express server
CMD ["node", "server.js"]