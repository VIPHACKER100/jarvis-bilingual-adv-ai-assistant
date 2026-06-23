# Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Build Backend
FROM python:3.11-slim AS backend

RUN addgroup --system --gid 1000 jarvis && adduser --system --uid 1000 --ingroup jarvis jarvis

# Install system dependencies required for some Python packages (like PyAudio, OpenCV, etc)
RUN apt-get update && apt-get install -y \
    build-essential \
    libportaudio2 \
    libportaudiocpp0 \
    portaudio19-dev \
    tesseract-ocr \
    tesseract-ocr-hin \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Python dependencies
COPY backend/requirements-prod.txt ./requirements.txt
RUN pip install --no-cache-dir --no-user -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/dist ./dist

# Set environment variables
ENV FRONTEND_URL=http://localhost:5173
ENV BACKEND_PORT=8000
ENV PYTHONPATH=/app

RUN chown -R jarvis:jarvis /app

USER jarvis

# Expose port
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 CMD curl --fail http://localhost:8000/api/v1/health || exit 1

# Run the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
