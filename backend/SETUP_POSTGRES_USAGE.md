# Using setup_postgres Command

## Quick Start

### Basic Usage

```bash
cd backend
python manage.py setup_postgres
```

## Environment Variables

The command reads from your `.env` file. Add these variables:

```bash
# Required
POSTGRES_ADMIN_PASSWORD=your_admin_password
POSTGRES_DB_PASSWORD=your_user_password

# Optional (with defaults)
POSTGRES_ADMIN_USER=postgres          # default: postgres
POSTGRES_DB_NAME=lamla_db             # default: lamla_db
POSTGRES_DB_USER=lamla_user           # default: lamla_user
POSTGRES_HOST=localhost               # default: localhost
POSTGRES_PORT=5432                    # default: 5432
```

## Command Options

### View Help
```bash
python manage.py setup_postgres --help
```

### Override Environment Variables
```bash
python manage.py setup_postgres \
  --admin-user postgres \
  --admin-password mypass \
  --db-name lamla_db \
  --db-user lamla_user \
  --db-password userpass
```

### Skip User Creation (Only Create Database)
```bash
python manage.py setup_postgres --skip-user-creation
```

## Examples

### Example 1: Using .env file
```bash
# .env file:
POSTGRES_ADMIN_PASSWORD=admin123
POSTGRES_DB_PASSWORD=secure_password_here

# Run command:
python manage.py setup_postgres
```

### Example 2: Using DATABASE_URL
```bash
# .env file:
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/postgres
POSTGRES_DB_USER=lamla_user
POSTGRES_DB_PASSWORD=secure_password_here

# Run command:
python manage.py setup_postgres
```

### Example 3: Command Line Override
```bash
python manage.py setup_postgres \
  --admin-password admin123 \
  --db-password userpass \
  --host db.example.com \
  --port 5432
```

## What It Does

1. Connects to PostgreSQL as admin user
2. Creates the database (`lamla_db` by default)
3. Creates the database user (`lamla_user` by default)
4. Grants all privileges on the database
5. Sets up schema permissions for Django migrations

## Troubleshooting

### "ModuleNotFoundError: No module named 'psycopg2'"
```bash
pip install psycopg2-binary
```

### "PostgreSQL admin password is required"
Make sure `POSTGRES_ADMIN_PASSWORD` is set in your `.env` file.

### "Database user password is required"
Make sure `POSTGRES_DB_PASSWORD` is set in your `.env` file.

### "Failed to connect to PostgreSQL"
- Check PostgreSQL is running
- Verify host and port are correct
- Check admin credentials
