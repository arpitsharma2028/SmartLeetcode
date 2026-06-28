# Use Node.js 20 LTS Alpine image for a smaller footprint
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose port (Render sets the PORT environment variable)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
