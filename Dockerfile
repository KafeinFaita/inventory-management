# Step 1: Build Vite frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY inventory-system-frontend ./inventory-system-frontend
WORKDIR /app/inventory-system-frontend
RUN npm install && npm run build

# Step 2: Set up backend
FROM node:18-alpine
WORKDIR /app
COPY inventory-system-backend ./inventory-system-backend
COPY --from=frontend-builder /app/inventory-system-frontend/dist ./inventory-system-backend/frontend/dist
WORKDIR /app/inventory-system-backend
RUN npm install
EXPOSE 5000
CMD ["node", "server.js"]