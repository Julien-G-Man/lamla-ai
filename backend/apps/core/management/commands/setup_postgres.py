"""
Django management command to set up PostgreSQL database for production.

This command reads database credentials from environment variables (.env file)
and creates the database user and grants necessary privileges.

Usage:
    python manage.py setup_postgres

Environment variables required:
    POSTGRES_ADMIN_USER - PostgreSQL admin username (default: postgres)
    POSTGRES_ADMIN_PASSWORD - PostgreSQL admin password
    POSTGRES_DB_NAME - Database name (default: lamla_db)
    POSTGRES_DB_USER - Database user to create (default: lamla_user)
    POSTGRES_DB_PASSWORD - Password for the database user

Or use DATABASE_URL format:
    DATABASE_URL=postgresql://admin_user:admin_pass@host:port/admin_db
    POSTGRES_DB_USER=lamla_user
    POSTGRES_DB_PASSWORD=user_password
"""
import os
import sys
from urllib.parse import urlparse
import psycopg2
from psycopg2 import sql
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings


class Command(BaseCommand):
    help = 'Set up PostgreSQL database and user for production (reads from .env)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-user',
            type=str,
            default=None,
            help='PostgreSQL admin username (overrides env var)',
        )
        parser.add_argument(
            '--admin-password',
            type=str,
            default=None,
            help='PostgreSQL admin password (overrides env var)',
        )
        parser.add_argument(
            '--db-name',
            type=str,
            default=None,
            help='Database name (overrides env var, default: lamla_db)',
        )
        parser.add_argument(
            '--db-user',
            type=str,
            default=None,
            help='Database user to create (overrides env var, default: lamla_user)',
        )
        parser.add_argument(
            '--db-password',
            type=str,
            default=None,
            help='Password for database user (overrides env var)',
        )
        parser.add_argument(
            '--host',
            type=str,
            default=None,
            help='PostgreSQL host (default: localhost)',
        )
        parser.add_argument(
            '--port',
            type=int,
            default=None,
            help='PostgreSQL port (default: 5432)',
        )
        parser.add_argument(
            '--skip-user-creation',
            action='store_true',
            help='Skip user creation, only create database',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Setting up PostgreSQL database...'))
        
        # Get configuration from environment or arguments
        admin_user = options['admin_user'] or os.getenv('POSTGRES_ADMIN_USER', 'postgres')
        admin_password = options['admin_password'] or os.getenv('POSTGRES_ADMIN_PASSWORD')
        db_name = options['db_name'] or os.getenv('POSTGRES_DB_NAME', 'lamla_db')
        db_user = options['db_user'] or os.getenv('POSTGRES_DB_USER', 'lamla_user')
        db_password = options['db_password'] or os.getenv('POSTGRES_DB_PASSWORD')
        host = options['host'] or os.getenv('POSTGRES_HOST', 'localhost')
        port = options['port'] or int(os.getenv('POSTGRES_PORT', '5432'))
        
        # Try to parse DATABASE_URL if available
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            try:
                parsed = urlparse(database_url)
                if not admin_password:
                    admin_password = parsed.password
                if not admin_user:
                    admin_user = parsed.username or 'postgres'
                if parsed.hostname:
                    host = parsed.hostname
                if parsed.port:
                    port = parsed.port
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Could not parse DATABASE_URL: {e}'))
        
        # Validate required parameters
        if not admin_password:
            raise CommandError(
                'PostgreSQL admin password is required. '
                'Set POSTGRES_ADMIN_PASSWORD in .env or use --admin-password'
            )
        
        if not options['skip_user_creation'] and not db_password:
            raise CommandError(
                'Database user password is required. '
                'Set POSTGRES_DB_PASSWORD in .env or use --db-password'
            )
        
        try:
            # Connect as admin user
            self.stdout.write(f'Connecting to PostgreSQL as {admin_user}...')
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=admin_user,
                password=admin_password,
                database='postgres'  # Connect to default database
            )
            conn.autocommit = True
            cursor = conn.cursor()
            
            # Create database
            self.stdout.write(f'Creating database {db_name}...')
            try:
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(db_name)
                    )
                )
                self.stdout.write(self.style.SUCCESS(f'✓ Database {db_name} created'))
            except psycopg2.errors.DuplicateDatabase:
                self.stdout.write(self.style.WARNING(f'⚠ Database {db_name} already exists'))
            
            # Create user (if not skipped)
            if not options['skip_user_creation']:
                self.stdout.write(f'Creating user {db_user}...')
                try:
                    cursor.execute(
                        sql.SQL("CREATE USER {} WITH PASSWORD %s").format(
                            sql.Identifier(db_user)
                        ),
                        [db_password]
                    )
                    self.stdout.write(self.style.SUCCESS(f'✓ User {db_user} created'))
                except psycopg2.errors.DuplicateObject:
                    self.stdout.write(self.style.WARNING(f'⚠ User {db_user} already exists'))
                
                # Grant privileges on database
                self.stdout.write(f'Granting privileges to {db_user}...')
                cursor.execute(
                    sql.SQL("GRANT ALL PRIVILEGES ON DATABASE {} TO {}").format(
                        sql.Identifier(db_name),
                        sql.Identifier(db_user)
                    )
                )
                
                # Connect to the new database to grant schema privileges
                cursor.close()
                conn.close()
                
                conn = psycopg2.connect(
                    host=host,
                    port=port,
                    user=admin_user,
                    password=admin_password,
                    database=db_name
                )
                conn.autocommit = True
                cursor = conn.cursor()
                
                # Grant schema privileges
                cursor.execute(
                    sql.SQL("GRANT ALL ON SCHEMA public TO {}").format(
                        sql.Identifier(db_user)
                    )
                )
                cursor.execute(
                    sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {}").format(
                        sql.Identifier(db_user)
                    )
                )
                cursor.execute(
                    sql.SQL("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {}").format(
                        sql.Identifier(db_user)
                    )
                )
                self.stdout.write(self.style.SUCCESS('✓ Privileges granted'))
            
            cursor.close()
            conn.close()
            
            self.stdout.write(self.style.SUCCESS('\n✓ Database setup complete!'))
            self.stdout.write('\nNext steps:')
            self.stdout.write('1. Update your .env file with:')
            if not options['skip_user_creation']:
                self.stdout.write(f'   DATABASE_URL=postgresql://{db_user}:{db_password}@{host}:{port}/{db_name}')
            else:
                self.stdout.write(f'   DATABASE_URL=postgresql://{admin_user}:{admin_password}@{host}:{port}/{db_name}')
            self.stdout.write('2. Run migrations: python manage.py migrate')
            
        except psycopg2.OperationalError as e:
            raise CommandError(f'Failed to connect to PostgreSQL: {e}')
        except psycopg2.Error as e:
            raise CommandError(f'PostgreSQL error: {e}')
