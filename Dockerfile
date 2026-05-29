# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for building the app)
RUN npm ci

# Copy the rest of the application files
COPY tsconfig.json vite.config.ts index.html server.ts ./
COPY src/ ./src/

# Build the frontend assets and compile server.ts to dist/server.cjs
RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment variable
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies to keep the image minimal
RUN npm ci --omit=dev

# Copy only the built assets and server entry point from the builder stage
COPY --from=builder /app/dist ./dist

# Expose port 3000 (port configured in server.ts)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
