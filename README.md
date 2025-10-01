# AI-Powered Social Media Campaign Backend

## Temporal Server Setup

To run workflows, you need a Temporal server running locally or remotely.

### Quick Start (Local Docker)

1. **Install Docker** if you haven't already: https://docs.docker.com/get-docker/
2. **Start Temporal Server**:
   ```bash
   docker run --rm -p 7233:7233 temporalio/temporal:latest
   ```
   This starts Temporal on port 7233.

For advanced setup or production deployment, see [Temporal Documentation](https://docs.temporal.io/).

# AI-Powered Social Media Campaign Backend

A robust backend system for managing AI-powered social media campaigns across LinkedIn, X (Twitter), and Instagram. Built with TypeScript, Express, Temporal workflows, and Google Gemini AI.

## Features

- **AI Content Generation**: Automatically generate platform-specific content using Google Gemini
- **Multi-Platform Support**: LinkedIn, X (Twitter), and Instagram
- **Workflow Orchestration**: Durable workflows with Temporal for reliable execution
- **Human Approval Flow**: Built-in approval process before publishing
- **Automatic Retry Logic**: Temporal-powered retry mechanisms for failed operations
- **Engagement Metrics**: Collect and track post performance metrics
- **Comprehensive Dashboard**: Analytics and insights API
- **Mock Services**: Development-friendly mock implementations

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Express API    │────▶│    Temporal     │
│  (Lovable.dev)  │     │    Server        │     │    Workflows    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   PostgreSQL     │     │  Google Gemini  │
                        │   Database       │     │       AI        │
                        └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Social Media   │
                                                 │     APIs        │
                                                 └─────────────────┘
```

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+)
- Redis (optional, for caching)
- Temporal Server (for workflow orchestration)
- Google Gemini API Key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-campaign-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your credentials:
   - Google Gemini API key
   - Database credentials
   - JWT secret
   - Social media API keys (optional for development)

4. **Set up PostgreSQL database**
   ```bash
   createdb social_campaigns
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

## Running the Application

### Development Mode

1. **Start Temporal Server** (using Docker)
   ```bash
   docker run --rm -p 7233:7233 temporalio/temporal:latest
   ```

2. **Start the API server and Temporal worker**
   ```bash
   npm run temporal:dev
   ```

   This runs both the Express server and Temporal worker concurrently.

### Production Mode

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Start the Temporal worker** (in a separate process)
   ```bash
   npm run temporal:worker
   ```

## API Endpoints

### Campaigns

- `POST /api/campaigns` - Create a new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/approve` - Approve/reject a campaign
- `GET /api/campaigns/:id/metrics` - Get campaign metrics
- `DELETE /api/campaigns/:id` - Delete a campaign

### Dashboard

- `GET /api/dashboard/metrics` - Overview metrics
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/dashboard/platform-performance` - Platform breakdown
- `GET /api/dashboard/engagement-trends` - Engagement over time

### Health Check

- `GET /health` - API health status

## Workflow Overview

1. **Campaign Creation**
   - User submits campaign idea
   - System generates platform-specific content using AI
   - Posts are created in draft status

2. **Approval Process**
   - Campaign enters pending approval state
   - Human reviews and approves/rejects
   - Approved campaigns proceed to publishing

3. **Publishing**
   - Posts are scheduled or published immediately
   - System handles platform-specific requirements
   - Retry logic for failed publications

4. **Metrics Collection**
   - Automatic metrics collection for 7 days
   - Real-time dashboard updates
   - Engagement rate calculations

## Development

### Project Structure

```
social-campaign-backend/
├── src/
│   ├── api/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Express middleware
│   ├── workflows/          # Temporal workflows
│   ├── services/           # Business logic
│   ├── models/             # Database models
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   └── config/             # Configuration
├── docs/                   # Documentation
├── tests/                  # Test files
└── scripts/                # Utility scripts
```

### Mock Services

The system includes mock implementations for development:
- Mock social media posting
- Mock metrics generation
- Auto-approval for demos

To use real services, see [Social Media API Integration Guide](docs/SOCIAL_MEDIA_API_INTEGRATION.md).

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Configuration

### Environment Variables

Key configuration options:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `GOOGLE_GEMINI_API_KEY` - For AI content generation
- `TEMPORAL_ADDRESS` - Temporal server address
- `JWT_SECRET` - For authentication

See `.env.example` for the complete list.

### Temporal Configuration

Workflows are configured with:
- Automatic retries (up to 5 attempts)
- Exponential backoff
- 24-hour approval timeout
- 7-day metrics collection

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Environment Setup

1. Set up PostgreSQL database
2. Deploy Temporal Server
3. Configure environment variables
4. Set up reverse proxy (nginx/caddy)
5. Configure SSL certificates

## Monitoring

The system includes:
- Winston logging with multiple transports
- Error tracking
- Performance metrics
- Health check endpoint

## Security

- JWT authentication
- Rate limiting
- CORS configuration
- Helmet.js for security headers
- Input validation
- SQL injection protection (via Sequelize)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Check the [documentation](docs/)
- Open an issue on GitHub
- Contact the development team

---

Built with ❤️ for the Kolomolo Hackathon
