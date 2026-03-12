# ── Build frontend ──
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Build Go backend ──
FROM golang:1.25-alpine AS backend-build
RUN apk add --no-cache gcc musl-dev
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN go mod tidy
RUN CGO_ENABLED=1 GOOS=linux go build -o server .

# ── Runtime ──
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /app

# Copy Go binary
COPY --from=backend-build /app/backend/server ./server

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

EXPOSE 8080

ENV PORT=8080
ENV GIN_MODE=release

CMD ["./server"]
