# Social Pilot 🚀

**AI-Powered Social Media Campaign Management Platform**

Social Pilot is a comprehensive solution for creating, managing, and automating social media campaigns across multiple platforms (LinkedIn, X/Twitter, and Instagram). Built with AI-powered content generation and workflow orchestration using Temporal.

![Social Pilot Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Node](https://img.shields.io/badge/Node-18%2B-green)

## 🌟 Features

### Core Capabilities
- **🤖 AI Content Generation**: Automatically generate platform-specific content using Google Gemini AI
- **📱 Multi-Platform Support**: LinkedIn, X (Twitter), and Instagram integration
- **⚡ Workflow Orchestration**: Durable workflows with Temporal for reliable execution
- **✅ Human Approval Flow**: Built-in approval process before publishing posts
- **🔄 Automatic Retry Logic**: Temporal-powered retry mechanisms for failed operations
- **📊 Engagement Metrics**: Real-time tracking of post performance and analytics
- **📈 Analytics Dashboard**: Comprehensive campaign insights and metrics visualization
- **🎨 Modern UI**: Beautiful, responsive interface built with React and shadcn/ui

### Advanced Features
- Campaign scheduling and automation
- Real-time metrics collection for 7 days
- Platform-specific content optimization
- Multi-post campaign management
- Activity tracking and audit logs
- Mock services for easy development and testing

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React         │────▶│   Express API    │────▶│    Temporal     │
│   Frontend      │     │    Server        │     │    Workflows    │
│  (TypeScript)   │     │  (TypeScript)    │     │   (Durable)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                          │
        ▼                        ▼                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Supabase      │     │   PostgreSQL     │     │  Google Gemini  │
│   (Auth & DB)   │     │   Database       │     │       AI        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │  Social Media   │
                                                 │     APIs        │
                                                 │ (LinkedIn, X)   │
                                                 └─────────────────┘
```

## 📦 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Supabase (Auth, Database, Storage)
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Workflow Engine**: Temporal.io
- **AI Engine**: Google Gemini AI
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT
- **Logging**: Winston
- **API Documentation**: OpenAPI/Swagger

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or pnpm
- PostgreSQL (v12+)
- Docker (for Temporal Server)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChathuRaaksha/Social-Pilot.git
   cd Social-Pilot
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../social-campaign-backend
   npm install
   ```

### Configuration

#### Frontend Setup

1. **Create environment file**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Add your Supabase URL and anon key to `.env`:
     ```env
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Run database migrations**
   ```bash
   # Apply Supabase migrations
   npx supabase db push
   ```

#### Backend Setup

1. **Create environment file**
   ```bash
   cd social-campaign-backend
   cp .env.example .env
   ```

2. **Configure environment variables**
   Edit `.env` and add:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=social_campaigns
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   
   # Google Gemini AI
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   
   # Temporal
   TEMPORAL_ADDRESS=localhost:7233
   
   # JWT
   JWT_SECRET=your_jwt_secret
   
   # Social Media APIs (optional for development)
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   X_API_KEY=your_x_api_key
   X_API_SECRET=your_x_api_secret
   ```

3. **Set up PostgreSQL database**
   ```bash
   createdb social_campaigns
   npm run db:migrate
   ```

4. **Start Temporal Server** (using Docker)
   ```bash
   docker run --rm -p 7233:7233 temporalio/temporal:latest
   ```

### Running the Application

#### Development Mode

1. **Start the Backend** (API + Temporal Worker)
   ```bash
   cd social-campaign-backend
   npm run temporal:dev
   ```

2. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Temporal UI: http://localhost:8080

#### Production Mode

1. **Build the Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Build the Backend**
   ```bash
   cd social-campaign-backend
   npm run build
   npm start
   ```

3. **Start Temporal Worker** (separate process)
   ```bash
   npm run temporal:worker
   ```

## 📚 API Documentation

### Campaign Endpoints

#### Create Campaign
```http
POST /api/campaigns
Content-Type: application/json

{
  "idea": "Launch announcement for new product",
  "platforms": ["linkedin", "twitter"],
  "scheduledFor": "2025-01-10T10:00:00Z"
}
```

#### Get Campaigns
```http
GET /api/campaigns
```

#### Get Campaign Details
```http
GET /api/campaigns/:id
```

#### Approve/Reject Campaign
```http
POST /api/campaigns/:id/approve
Content-Type: application/json

{
  "approved": true,
  "feedback": "Looks great!"
}
```

#### Get Campaign Metrics
```http
GET /api/campaigns/:id/metrics
```

### Dashboard Endpoints

#### Get Dashboard Metrics
```http
GET /api/dashboard/metrics
```

#### Get Recent Activities
```http
GET /api/dashboard/activities
```

#### Platform Performance
```http
GET /api/dashboard/platform-performance
```

## 🔄 Workflow Process

### 1. Campaign Creation
1. User submits campaign idea via frontend
2. Backend validates and creates campaign
3. Temporal workflow starts

### 2. Content Generation
1. AI generates platform-specific content
2. Posts created in draft status
3. Campaign enters pending approval

### 3. Approval Process
1. User reviews generated content
2. Approves or rejects with feedback
3. Approved campaigns proceed to publishing

### 4. Publishing
1. Posts are scheduled or published immediately
2. Handles platform-specific requirements
3. Retry logic for failed publications

### 5. Metrics Collection
1. Automatic metrics collection for 7 days
2. Real-time dashboard updates
3. Engagement rate calculations

## 📁 Project Structure

```
social-pilot/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── lib/             # Utility functions
│   │   └── integrations/    # Third-party integrations
│   ├── supabase/            # Supabase config and migrations
│   └── public/              # Static assets
│
├── social-campaign-backend/   # Express backend application
│   ├── src/
│   │   ├── api/             # API layer
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── routes/      # API routes
│   │   │   └── middleware/  # Express middleware
│   │   ├── workflows/       # Temporal workflows
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utilities
│   │   └── config/          # Configuration
│   ├── docs/                # Documentation
│   └── social-posts-temporal/ # Python Temporal workers
│
└── README.md                 # This file
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd social-campaign-backend
npm run test
npm run test:coverage
```

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers
- Input validation with Zod
- SQL injection protection via Sequelize ORM
- XSS protection
- Environment variable encryption

## 🎨 UI Components

The frontend uses shadcn/ui, providing:
- Accessible components (ARIA compliant)
- Customizable with Tailwind CSS
- Dark mode support
- Responsive design
- Beautiful animations

## 📊 Monitoring & Logging

- Winston logging with multiple transports
- Error tracking and reporting
- Performance metrics
- Health check endpoint
- Temporal workflow monitoring

## 🚢 Deployment

### Docker Deployment

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
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
6. Set up monitoring and logging

### Recommended Platforms

- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: AWS ECS, Google Cloud Run, or Railway
- **Database**: AWS RDS, Supabase, or Railway PostgreSQL
- **Temporal**: Temporal Cloud or self-hosted

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📖 Documentation

- [Frontend README](./frontend/README.md)
- [Backend README](./social-campaign-backend/README.md)
- [Social Media API Integration Guide](./social-campaign-backend/docs/SOCIAL_MEDIA_API_INTEGRATION.md)
- [Temporal Integration Guide](./frontend/TEMPORAL_INTEGRATION.md)

## 🐛 Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
- Check that backend is running on correct port
- Verify CORS configuration
- Check environment variables

**Temporal workflows not executing:**
- Ensure Temporal Server is running
- Check Temporal worker is started
- Verify workflow definitions are registered

**Database connection errors:**
- Confirm PostgreSQL is running
- Check database credentials in .env
- Verify database exists and migrations are run

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ for the Kolomolo Hackathon

## 🙏 Acknowledgments

- [Temporal.io](https://temporal.io/) for workflow orchestration
- [Google Gemini](https://deepmind.google/technologies/gemini/) for AI capabilities
- [Supabase](https://supabase.com/) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Lovable.dev](https://lovable.dev/) for rapid frontend development

## 📧 Support

For issues, questions, or contributions:
- 🐛 [Report a Bug](https://github.com/ChathuRaaksha/Social-Pilot/issues)
- 💡 [Request a Feature](https://github.com/ChathuRaaksha/Social-Pilot/issues)
- 📧 Contact: [Your Email]

## 🗺️ Roadmap

- [ ] Instagram integration
- [ ] Advanced analytics and reporting
- [ ] A/B testing for campaigns
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] API rate limiting optimization
- [ ] Enhanced AI content suggestions
- [ ] Collaborative campaign editing

---

**Made with 💜 by the Social Pilot Team**

⭐ Star us on GitHub if you find this project helpful!
