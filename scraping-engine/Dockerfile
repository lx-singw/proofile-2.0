# Scraping Engine Dockerfile

FROM python:3.11-slim-bookworm as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies including Playwright requirements and Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install poetry==1.7.1

WORKDIR /app

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies (regenerate lock file if needed)
RUN poetry config virtualenvs.create false \
    && poetry lock --no-update \
    && poetry install --no-interaction --no-ansi --no-root

# Install Playwright browsers and dependencies
RUN playwright install --with-deps chromium

# Copy application code
COPY . .

# Run spider (placeholder command, overridden in docker-compose)
CMD ["poetry", "run", "scrapy", "crawl", "base_spider"]
