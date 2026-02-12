FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpcap-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy capabilities helpers
COPY pyproject.toml .
# In a real setup, we would perform a proper install. 
# For now, we manually install dependencies.
RUN pip install --user scapy aiokafka pydantic loguru

FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies for Scapy (libpcap)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpcap0.8 \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy project code
COPY pkg/ pkg/
COPY services/listener/ services/listener/

# Set Python path to include root for imports
ENV PYTHONPATH=/app

CMD ["python", "services/listener/main.py"]
