# ---------- Stage 1: Build ----------

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files

COPY package*.json ./

# Install dependencies

RUN npm install

# Copy source code

COPY . .

# Build the app

RUN npm run build

# ---------- Stage 2: Runtime ----------

FROM node:20-alpine

WORKDIR /app

# Copy package.json and only production dependencies

COPY package*.json ./
RUN npm install --production

# Copy built files from builder

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/workspaces-data ./workspaces-data

# Set environment variables (optional, can be set in Render dashboard)

ENV NODE_ENV=production

# Expose port (Render will provide PORT env)

EXPOSE 3000

# Start the NestJS app

CMD ["node", "dist/main.js"]
