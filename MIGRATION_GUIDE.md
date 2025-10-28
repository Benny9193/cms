# PostgreSQL Migration Guide

This guide will help you migrate from SQLite to PostgreSQL for better performance and advanced search capabilities.

## Why Migrate to PostgreSQL?

PostgreSQL offers several advantages over SQLite:

- **Full-text search with ranking** - Better search results with relevance scoring
- **Better performance** - Handles larger datasets more efficiently
- **Advanced indexing** - GIN indexes for fast text search
- **Stemming and stop words** - Intelligent word matching
- **Production-ready** - Designed for concurrent users and high traffic
- **Scalability** - Better for growing applications

## Prerequisites

Install PostgreSQL on your system:

### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
Download and install from: https://www.postgresql.org/download/windows/

### Docker (Alternative)
```bash
docker run --name cms-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=cms_db -p 5432:5432 -d postgres:15
```

## Step 1: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cms_db;

# Create user (optional, for production)
CREATE USER cms_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cms_db TO cms_user;

# Exit psql
\q
```

## Step 2: Update Environment Configuration

Update your `.env` file with the PostgreSQL connection string:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_db?schema=public"

# Or with custom user
# DATABASE_URL="postgresql://cms_user:your_secure_password@localhost:5432/cms_db?schema=public"
```

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

## Step 3: Run Database Migration

The Prisma schema has been updated to use PostgreSQL. Run these commands:

```bash
# Generate Prisma client for PostgreSQL
npm run db:generate

# Create the database schema
npm run db:push

# Or use migrations (recommended for production)
npx prisma migrate dev --name init
```

## Step 4: Add Full-Text Search Indexes

Run the custom migration to add full-text search capabilities:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d cms_db

# Or if using custom user
psql -U cms_user -d cms_db

# Run the migration SQL (from psql prompt)
\i prisma/migrations/add_fulltext_search/migration.sql

# Exit
\q
```

**Alternative: Run SQL directly**
```bash
cat prisma/migrations/add_fulltext_search/migration.sql | psql -U postgres -d cms_db
```

## Step 5: Data Migration (Optional)

If you have existing data in SQLite, you can migrate it:

### Option A: Export/Import via CSV

```bash
# Export from SQLite
sqlite3 dev.db

.mode csv
.output users.csv
SELECT * FROM User;
.output posts.csv
SELECT * FROM Post;
.output categories.csv
SELECT * FROM Category;
.quit

# Import to PostgreSQL
psql -U postgres -d cms_db

\copy "User" FROM 'users.csv' WITH CSV;
\copy "Post" FROM 'posts.csv' WITH CSV;
\copy "Category" FROM 'categories.csv' WITH CSV;
```

### Option B: Use Prisma Studio

```bash
# With SQLite (export data)
DATABASE_URL="file:./dev.db" npx prisma studio

# With PostgreSQL (import data manually)
DATABASE_URL="postgresql://postgres:password@localhost:5432/cms_db" npx prisma studio
```

### Option C: pgloader (Automated)

```bash
# Install pgloader
brew install pgloader  # macOS
sudo apt install pgloader  # Ubuntu

# Create config file: cms.load
cat > cms.load << 'EOF'
LOAD DATABASE
  FROM sqlite://dev.db
  INTO postgresql://postgres:password@localhost/cms_db
  WITH include drop, create tables, create indexes, reset sequences
  SET work_mem to '16MB', maintenance_work_mem to '512 MB';
EOF

# Run migration
pgloader cms.load
```

## Step 6: Verify Migration

```bash
# Start the server
npm run dev

# Test the health endpoint
curl http://localhost:3000/api/health

# Test search with PostgreSQL full-text search
curl "http://localhost:3000/api/posts/search?q=tutorial"
```

## Step 7: Test Advanced Search Features

PostgreSQL full-text search supports:

### Basic Search
```bash
curl "http://localhost:3000/api/posts/search?q=javascript"
```

### Phrase Search
```bash
curl "http://localhost:3000/api/posts/search?q='javascript tutorial'"
```

### Boolean Search
```bash
# AND operator
curl "http://localhost:3000/api/posts/search?q=javascript+tutorial"

# OR operator
curl "http://localhost:3000/api/posts/search?q=javascript+or+typescript"

# NOT operator
curl "http://localhost:3000/api/posts/search?q=javascript+-react"
```

### Results are now ranked by relevance!
- Title matches are weighted highest (Weight A)
- Excerpt matches are medium priority (Weight B)
- Content matches are lower priority (Weight C)

## Production Deployment

### Environment Variables

Set these in your production environment:

```env
DATABASE_URL="postgresql://user:password@your-host:5432/cms_db?schema=public&sslmode=require"
NODE_ENV=production
```

### Managed PostgreSQL Services

Consider using:
- **Heroku Postgres** - Easy setup, free tier available
- **AWS RDS** - Scalable, managed service
- **DigitalOcean Managed Databases** - Simple pricing
- **Supabase** - PostgreSQL with extra features
- **Neon** - Serverless PostgreSQL

### Connection Pooling (Recommended)

For production, use connection pooling:

```bash
# Install pg-pool
npm install pg-pool
```

Update DATABASE_URL:
```env
DATABASE_URL="postgresql://user:password@host:5432/cms_db?schema=public&connection_limit=10&pool_timeout=20"
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### Authentication Failed

```bash
# Edit pg_hba.conf to allow local connections
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Add this line:
local   all   all   trust

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Migration Fails

```bash
# Reset the database
npx prisma migrate reset

# Run migrations again
npx prisma migrate dev
```

### Search Not Working

```bash
# Verify search_vector column exists
psql -U postgres -d cms_db

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Post' AND column_name = 'search_vector';

# Re-run the full-text search migration
\i prisma/migrations/add_fulltext_search/migration.sql
```

## Rollback to SQLite (If Needed)

If you need to rollback:

```env
# Change DATABASE_URL in .env
DATABASE_URL="file:./dev.db"
```

```bash
# Regenerate Prisma client
npm run db:generate

# Push schema
npm run db:push
```

## Performance Tips

### 1. Regular VACUUM
```sql
-- Run periodically to optimize performance
VACUUM ANALYZE "Post";
```

### 2. Monitor Query Performance
```sql
-- Enable timing
\timing on

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### 3. Index Maintenance
```sql
-- Rebuild indexes
REINDEX TABLE "Post";
```

## Benefits After Migration

✅ **Faster Search** - Full-text search with GIN indexes
✅ **Better Ranking** - Results sorted by relevance
✅ **Stemming** - Matches "running" when searching for "run"
✅ **Stop Words** - Ignores common words like "the", "and"
✅ **Scalability** - Handles thousands of posts efficiently
✅ **Production Ready** - Used by major applications worldwide

## Support

For issues or questions:
- Prisma Docs: https://www.prisma.io/docs/
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Create an issue in this repository

## Next Steps

After successful migration:
1. Create admin user with role='admin'
2. Test all CRUD operations
3. Create sample posts and categories
4. Test search functionality
5. Configure backups
6. Set up monitoring

Happy searching! 🚀
