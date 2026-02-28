# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# The static files will be served by Nginx in the compose stack
# We just need this stage to produce the 'dist' folder
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/dist ./dist
