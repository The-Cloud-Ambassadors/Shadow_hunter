# ── Stage 1: Build the React Frontend ──
FROM node:20-slim AS frontend-builder

WORKDIR /frontend

# Copy only package files first for better Docker layer caching
COPY services/dashboard/package.json services/dashboard/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the dashboard source
COPY services/dashboard/ .

# Build the production bundle (outputs to /frontend/dist)
RUN npm run build


# ── Stage 2: Python Backend + Serve Built Frontend ──
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (for scapy / networking)
RUN apt-get update && apt-get install -y \
    gcc \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject so pip can install dependencies declared there
COPY pyproject.toml .

# Install project and dependencies from pyproject
RUN pip install --no-cache-dir .

# Copy full app source
COPY . .

# Copy the built React frontend from Stage 1 into /app/static
COPY --from=frontend-builder /frontend/dist /app/static

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Use run_local.py to start the full engine (broker, analyzer, simulator, API)
# This ensures demo mode works with live data generation
CMD ["python", "run_local.py"]
