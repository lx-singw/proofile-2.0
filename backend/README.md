# Proofile Backend API

FastAPI-based backend for the Proofile application.

## Features
- User authentication and authorization
- Resume management (CRUD operations)
- PDF export functionality
- AI-powered resume analysis
- Job recommendations

## Tech Stack
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT with python-jose
- **PDF Generation**: WeasyPrint
- **PDF Parsing**: pdfminer-six
- **Task Queue**: Celery with Redis
- **AI Integration**: OpenAI, Anthropic

## Development
```bash
# Install dependencies
poetry install

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```
