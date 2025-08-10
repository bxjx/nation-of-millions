# Local Development Setup

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- ngrok installed (for OAuth testing)

## Quick Start

### 1. Clone and Install
```bash
git clone <repository>
cd nation-of-millions
npm install
```

### 2. Start Local Database
```bash
npm run db:start
```

This will:
- Start PostgreSQL in Docker on port 5432
- Automatically create the database schema
- Set up the `oauth_tokens` table

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
NATIONBUILDER_SLUG=your_nation_slug
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret
DATABASE_URL_LOCAL=postgresql://postgres:password@localhost:5432/nationbuilder_automation
OAUTH_REDIRECT_URI=https://your-ngrok-url.ngrok.io/callback
NB_MAPPING_1=your_tag|your_path|step_number
```

### 4. Set Up OAuth Tokens

#### Start ngrok (in another terminal):
```bash
ngrok http 3000
```

#### Run OAuth setup:
```bash
npm run oauth:setup
```

#### Save tokens to database:
```bash
npm run oauth:save
```

### 5. Run the Application
```bash
npm run dev
```

## Database Management

### Start Database
```bash
npm run db:start
```

### Stop Database
```bash
npm run db:stop
```

### View Database Logs
```bash
npm run db:logs
```

### Connect to Database (optional)
```bash
docker exec -it nationbuilder-postgres psql -U postgres -d nationbuilder_automation
```

## Development Workflow

1. **Make changes** to TypeScript files
2. **Test locally** with `npm run dev`
3. **Database persists** between runs (Docker volume)
4. **Tokens refresh automatically** when needed

## Troubleshooting

### Database Connection Issues
```bash
# Stop and restart database
npm run db:stop
npm run db:start

# Check if container is running
docker ps
```

### OAuth Token Issues
```bash
# Re-run OAuth setup
npm run oauth:setup
npm run oauth:save
```

### View Token Status
```bash
# Connect to database and check tokens
docker exec -it nationbuilder-postgres psql -U postgres -d nationbuilder_automation
\dt
SELECT expires_at, created_at FROM oauth_tokens ORDER BY updated_at DESC LIMIT 1;
```