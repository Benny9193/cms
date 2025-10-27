# Headless CMS

A modern, TypeScript-based headless CMS built with Node.js, Express, and Prisma.

## Features

- RESTful API for content management
- User authentication with JWT
- Role-based access control (User/Admin)
- Content management (Posts, Categories)
- File upload support
- SQLite database (easily swappable to PostgreSQL/MySQL)
- TypeScript for type safety
- Prisma ORM for database operations

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (via Prisma ORM)
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

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and update the values as needed.

4. Generate Prisma client
```bash
npm run db:generate
```

5. Push the database schema
```bash
npm run db:push
```

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

## Next Steps

1. Implement authentication endpoints (register, login)
2. Add post CRUD operations
3. Add category management
4. Implement file upload functionality
5. Add validation middleware
6. Create React admin panel (Phase 2)

## License

ISC
