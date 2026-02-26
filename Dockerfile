# Use lightweight Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies (if needed for scapy / networking)
RUN apt-get update && apt-get install -y \
    gcc \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject so pip can install dependencies declared there
COPY pyproject.toml .

# Install project and dependencies from pyproject
RUN pip install --no-cache-dir .

# Copy full app
COPY . .

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Use uvicorn to serve the FastAPI app in production
ENTRYPOINT ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"]
