# Headless CMS

A modern, TypeScript-based headless CMS built with Node.js, Express, and Prisma.

## Features

- RESTful API for content management
- User authentication with JWT
- Role-based access control (User/Admin)
- Content management (Posts, Categories)
- File upload support
- **PostgreSQL with advanced full-text search** (with SQLite fallback)
- Full-text search with ranking and relevance scoring
- TypeScript for type safety
- Prisma ORM for database operations

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (recommended) or SQLite
- **Search**: PostgreSQL full-text search with GIN indexes
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer

## Project Structure

```
cms/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── uploads/                # Uploaded files
├── .env                    # Environment variables
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL 12+ (recommended) or SQLite (for quick start)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd cms
```

2. Install dependencies
```bash
npm install
```

3. Set up database

**Option A: PostgreSQL (Recommended for production and advanced search)**

Install PostgreSQL and create a database:
```bash
# Create database
createdb cms_db

# Or using psql
psql -U postgres
CREATE DATABASE cms_db;
```

**Option B: SQLite (Quick start)**

No installation needed, uses a local file.

4. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and update the DATABASE_URL:

For PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cms_db?schema=public"
```

For SQLite:
```env
DATABASE_URL="file:./dev.db"
```

5. Generate Prisma client
```bash
npm run db:generate
```

6. Push the database schema
```bash
npm run db:push
```

7. **(PostgreSQL only)** Set up full-text search indexes
```bash
cat prisma/migrations/add_fulltext_search/migration.sql | psql -U postgres -d cms_db
```

### Migrating from SQLite to PostgreSQL

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed instructions on migrating to PostgreSQL for better performance and advanced search features.

### Running the Application

#### Development mode
```bash
npm run dev
```

The server will start on `http://localhost:3000`

#### Production mode
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Authentication (Coming Soon)
```
POST /api/auth/register
POST /api/auth/login
```

### Posts (Coming Soon)
```
GET    /api/posts
GET    /api/posts/:id
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
```

### Categories (Coming Soon)
```
GET    /api/categories
GET    /api/categories/:id
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create a migration
npm run db:migrate

# Open Prisma Studio (GUI for database)
npm run db:studio
```

## Admin Dashboard

This CMS includes a comprehensive REST API. To build a user-friendly admin interface:

📘 **See [ADMIN_DASHBOARD_GUIDE.md](ADMIN_DASHBOARD_GUIDE.md)** for complete instructions on creating a React-based admin dashboard.

The guide includes:
- Complete React + TypeScript setup with Vite
- Authentication and routing
- Full CRUD interfaces for posts, categories, tags
- Comment moderation system
- File upload interface
- Ready-to-use code examples

## Features Summary

✅ **Implemented Features:**
- User authentication (JWT)
- Post management with tags and categories
- Full-text search with PostgreSQL
- Comment system with moderation
- File uploads with validation
- Category and tag organization
- Role-based access control
- RESTful API

## License

ISC
