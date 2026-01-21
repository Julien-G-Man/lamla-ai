# PostgreSQL Setup for Lamla AI

This guide will help you set up PostgreSQL for development with the `lamla_db` database.

## Prerequisites

- PostgreSQL installed on your system
- Python package `psycopg2-binary` (already in requirements.txt)

## Installation

### Windows

1. **Download PostgreSQL:**
   - Visit https://www.postgresql.org/download/windows/
   - Download and run the installer
   - During installation, remember the password you set for the `postgres` user

2. **Verify Installation:**
   ```powershell
   psql --version
   ```

### macOS

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Database Setup

### Development (Local)

For local development, manually create the database using command line:

**Windows (using psql):**
```powershell
# Open Command Prompt or PowerShell
psql -U postgres

# In psql prompt:
CREATE DATABASE lamla_db;
\q
```

**macOS/Linux:**
```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE DATABASE lamla_db;
\q
```

### Production (Automated Setup)

For production, use the Django management command that reads credentials from `.env`:

**1. Configure environment variables in `.env`:**
```bash
# PostgreSQL admin credentials (for creating database/user)
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=your_admin_password

# Database configuration
POSTGRES_DB_NAME=lamla_db
POSTGRES_DB_USER=lamla_user
POSTGRES_DB_PASSWORD=your_secure_password_here

# Optional: Connection details
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**2. Run the setup command:**
```bash
cd backend
python manage.py setup_postgres
```

This will:
- Create the database `lamla_db`
- Create the user `lamla_user` with the specified password
- Grant all necessary privileges
- Set up schema permissions

**Alternative: Using DATABASE_URL format:**
```bash
# In .env
DATABASE_URL=postgresql://admin_user:admin_password@host:5432/postgres
POSTGRES_DB_USER=lamla_user
POSTGRES_DB_PASSWORD=user_password
```

**Command options:**
```bash
# Skip user creation (only create database)
python manage.py setup_postgres --skip-user-creation

# Override environment variables
python manage.py setup_postgres --db-name mydb --db-user myuser --db-password mypass
```

### 3. Configure Django Database Connection

**⚠️ IMPORTANT: Never commit `.env` files to version control!**

Create or update your `.env` file in the `backend` directory (this file is already in `.gitignore`):

```bash
# Database Configuration
# Use strong passwords - never commit these to git!
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/lamla_db

# Or if you created a dedicated user:
# DATABASE_URL=postgresql://lamla_user:your_secure_password@localhost:5432/lamla_db
```

**Default values (if DATABASE_URL is not set - DEV ONLY):**
- User: `postgres`
- Password: `postgres` ⚠️ **Change this in production!**
- Host: `localhost`
- Port: `5432`
- Database: `lamla_db`

## Running Migrations

After setting up PostgreSQL, run Django migrations:

```bash
cd backend
python manage.py migrate
```

This will create all the necessary tables in the `lamla_db` database.

## Verify Setup

Test the connection:

```bash
python manage.py dbshell
```

You should see the PostgreSQL prompt. Type `\dt` to see tables, then `\q` to exit.

## Troubleshooting

### "FATAL: password authentication failed"

- Check your `.env` file has the correct password
- Verify the user exists: `psql -U postgres -l`

### "FATAL: database 'lamla_db' does not exist"

- Create the database: `CREATE DATABASE lamla_db;`

### "could not connect to server"

- Check PostgreSQL is running:
  - Windows: Check Services (services.msc) for "postgresql"
  - macOS: `brew services list`
  - Linux: `sudo systemctl status postgresql`

### Port 5432 already in use

- Check if another PostgreSQL instance is running
- Or change the port in your `DATABASE_URL`

## Development vs Production

### Development
- Uses local PostgreSQL
- Default credentials are acceptable for local dev only
- **Never commit `.env` files to git** (already in `.gitignore`)

### Production
- **Use a managed PostgreSQL service** (AWS RDS, Azure Database, Heroku Postgres, etc.)
- **Never hardcode passwords** - use environment variables or secrets manager
- **Use strong, unique passwords** for database users
- **Rotate passwords regularly**
- Set `DATABASE_URL` as an environment variable (not in code or config files)

## Bot Memory Configuration

The bot is configured to remember the **last 5 conversations** (10 messages total: 5 user + 5 AI) for each user session. This is handled automatically in `apps/chatbot/async_views.py`.
