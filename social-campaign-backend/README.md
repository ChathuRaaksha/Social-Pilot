# Social Pilot Backend - Python/Temporal

AI-powered social media campaign backend built with Python, Flask, and Temporal workflows.

## 🌟 Features

- **Flask REST API**: Lightweight and efficient web framework
- **Temporal Workflows**: Durable, reliable workflow orchestration
- **Google Gemini AI**: Advanced content generation
- **Multi-Platform Support**: LinkedIn, X (Twitter), Facebook, Instagram
- **Async/Await**: High-performance asynchronous operations
- **Type Safety**: Pydantic models for data validation
- **Mock Mode**: Easy testing without real API calls

## 📋 Prerequisites

- Python 3.9+
- Temporal Server (Docker or local)
- PostgreSQL 12+ (optional, for data persistence)
- Google Gemini API Key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Required environment variables:
- `GOOGLE_GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `TEMPORAL_HOST`: Default is `localhost`
- `TEMPORAL_PORT`: Default is `7233`

### 3. Start Temporal Server

Using Docker:
```bash
docker run --rm -p 7233:7233 \
  -e DYNAMIC_CONFIG_FILE_PATH=/config/dynamicconfig/development-cass.yaml \
  temporalio/auto-setup:latest
```

Or use Temporal Cloud or self-hosted installation.

### 4. Start the Temporal Worker

```bash
python worker.py
```

The worker processes workflow tasks in the background.

### 5. Start the API Server

```bash
# Development mode
python api.py

# Production mode with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8080 api:app
```

The API will be available at `http://localhost:8080`

## 📚 API Endpoints

### Health Check
```http
GET /healthz
```

Returns server health and Temporal connection status.

### Generate Social Media Posts
```http
POST /api/v1/social-posts
Content-Type: application/json

{
  "idea": "Launch announcement for new AI product",
  "audience": "tech professionals",
  "tone": "professional and exciting",
  "platforms": ["linkedin", "twitter"],
  "wait": true,
  "timeout_seconds": 120
}
```

Response:
```json
{
  "workflow_id": "social-post-1234567890",
  "run_id": "abc-123-def",
  "status": "completed",
  "result": {
    "posts": [
      {
        "platform": "linkedin",
        "content": "🚀 Exciting news! ...",
        "hashtags": ["#AI", "#Innovation"]
      },
      {
        "platform": "twitter",
        "content": "🎉 Big announcement! ...",
        "hashtags": ["#TechNews", "#AI"]
      }
    ]
  }
}
```

### Check Workflow Status
```http
GET /api/v1/social-posts/{workflow_id}?run_id={run_id}&timeout_seconds=1
```

### Publish Post to Social Media
```http
POST /api/v1/social-posts/publish
Content-Type: application/json

{
  "post_id": "uuid",
  "platform": "linkedin",
  "content": "Post content here",
  "access_token": "oauth_token",
  "image_url": "https://example.com/image.jpg",
  "use_mock": false,
  "wait": true
}
```

## 🏗️ Architecture

```
┌─────────────────┐
│   Flask API     │
│   (api.py)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Temporal       │─────▶│  Activities      │
│  Workflows      │      │  - AI Generation │
│  (workflows.py) │      │  - Social Posts  │
└─────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Worker         │
│  (worker.py)    │
└─────────────────┘
```

### Core Components

#### 1. **api.py** - Flask Application
- REST API endpoints
- Request validation
- Workflow orchestration
- CORS configuration

#### 2. **workflows.py** - Temporal Workflows
- `SocialPostWorkflow`: Main content generation workflow
- Durable execution with retries
- State management

#### 3. **posting_workflows.py** - Publishing Workflows
- `PostToSocialMediaWorkflow`: Handles actual posting
- Platform-specific logic
- OAuth integration

#### 4. **activities.py** - Temporal Activities
- AI content generation
- Mock implementations for testing
- Error handling and retries

#### 5. **linkedin_activities.py** - LinkedIn Integration
- OAuth authentication
- Post creation
- Profile data fetching

#### 6. **x_activities.py** - X (Twitter) Integration
- API v2 integration
- Tweet creation
- Media uploads

#### 7. **worker.py** - Temporal Worker
- Executes workflows and activities
- Handles task queue processing
- Graceful shutdown

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 8080 |
| `FLASK_ENV` | Environment | development |
| `TEMPORAL_HOST` | Temporal server host | localhost |
| `TEMPORAL_PORT` | Temporal server port | 7233 |
| `TEMPORAL_NAMESPACE` | Temporal namespace | default |
| `TEMPORAL_TASK_QUEUE` | Task queue name | social-post-queue |
| `GOOGLE_GEMINI_API_KEY` | Gemini API key | Required |
| `USE_MOCK_SERVICES` | Use mocks for testing | false |
| `LOG_LEVEL` | Logging level | INFO |

### Temporal Configuration

Workflows are configured with:
- **Execution Timeout**: 1 hour
- **Task Timeout**: 5 minutes
- **Retry Policy**: Exponential backoff, max 5 attempts
- **Task Queue**: `social-post-queue`

## 🧪 Testing

### Run Tests
```bash
pytest

# With coverage
pytest --cov=. --cov-report=html
```

### Manual Testing

Test with mock services (no real API calls):
```bash
# Set in .env
USE_MOCK_SERVICES=true

# Or with curl
curl -X POST http://localhost:8080/api/v1/social-posts \
  -H "Content-Type: application/json" \
  -d '{
    "idea": "Test post",
    "platforms": ["linkedin"],
    "wait": true
  }'
```

### Demo Script

```bash
./demo.sh
```

Runs through complete workflow demonstration.

## 🔐 Security

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Rotate API keys regularly

### OAuth Tokens
- Store tokens securely (environment variables or secrets manager)
- Implement token refresh logic
- Use short-lived tokens when possible

### API Security
- Implement rate limiting (add middleware)
- Add authentication layer
- Validate all inputs
- Use HTTPS in production

## 🚀 Deployment

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8080

# Run with gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "api:app"]
```

**Build and run:**
```bash
docker build -t social-pilot-backend .
docker run -p 8080:8080 --env-file .env social-pilot-backend
```

### Production Best Practices

1. **Use Gunicorn** for production WSGI server
2. **Set up Nginx** as reverse proxy
3. **Enable HTTPS** with SSL certificates
4. **Configure logging** to external service
5. **Monitor workflows** in Temporal UI
6. **Scale workers** based on load
7. **Use managed Temporal Cloud** for reliability

### Environment Setup

**Development:**
```bash
export FLASK_ENV=development
export FLASK_DEBUG=True
python api.py
```

**Production:**
```bash
export FLASK_ENV=production
export FLASK_DEBUG=False
gunicorn -w 4 -b 0.0.0.0:8080 --timeout 120 api:app
```

## 📊 Monitoring

### Temporal UI

Access at `http://localhost:8080` (default Temporal UI)

Monitor:
- Workflow executions
- Activity completions
- Error rates
- Execution times

### Logging

Logs are written to:
- Console (stdout)
- File: `logs/app.log`
- Temporal workflow history

Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

### Metrics

Implement metrics collection:
- Request count
- Response times
- Error rates
- Workflow success/failure rates

## 🐛 Troubleshooting

### Temporal Connection Issues

```bash
# Check Temporal server
docker ps | grep temporal

# Test connection
curl http://localhost:8080/healthz
```

### Worker Not Processing Tasks

1. Check worker is running: `ps aux | grep worker.py`
2. Verify task queue name matches in config
3. Check Temporal UI for pending tasks
4. Review worker logs for errors

### API Errors

```bash
# Check API logs
tail -f logs/app.log

# Test endpoint
curl -v http://localhost:8080/healthz
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Import errors | Reinstall requirements: `pip install -r requirements.txt` |
| Connection timeout | Check Temporal server is running |
| AI generation fails | Verify `GOOGLE_GEMINI_API_KEY` is set |
| Module not found | Activate virtual environment |

## 📖 Development

### Code Style

```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

### Adding New Platforms

1. Create new activity file (e.g., `instagram_activities.py`)
2. Implement posting logic
3. Add to `posting_workflows.py`
4. Update configuration

### Extending Workflows

```python
@workflow.defn
class CustomWorkflow:
    @workflow.run
    async def run(self, params: dict) -> dict:
        # Your workflow logic
        result = await workflow.execute_activity(
            your_activity,
            params,
            start_to_close_timeout=timedelta(minutes=5)
        )
        return result
```

## 📝 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit pull request

## 📧 Support

- GitHub Issues: Report bugs and request features
- Documentation: See main README.md
- Temporal Docs: https://docs.temporal.io

---

Built with ❤️ using Python, Flask, and Temporal
