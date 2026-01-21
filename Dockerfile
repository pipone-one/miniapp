# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir google-generativeai

# Copy backend code
COPY backend/app ./app
COPY backend/.env .

# Copy frontend dist (assuming it's built)
# Note: In a real production setup, we might use Nginx to serve frontend
# For now, we rely on FastAPI's SPA fallback
COPY frontend/dist ./frontend/dist

# Expose port
EXPOSE 8000

# Run
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
