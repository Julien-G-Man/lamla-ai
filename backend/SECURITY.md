# Security Best Practices for Lamla AI

## ⚠️ Critical Security Rules

### 1. Never Commit Secrets to Version Control

**DO NOT commit:**
- `.env` files (already in `.gitignore`)
- Hardcoded passwords in code
- API keys in source files
- Database credentials in scripts

**DO commit:**
- `.env.example` (template with placeholders)
- Configuration files (without secrets)
- Documentation

### 2. Database Passwords

**Development:**
- Use strong passwords even for local development
- Store in `.env` file (never commit)
- Default `postgres:postgres` is acceptable for local dev only

**Production:**
- **Never** use default passwords
- Use managed database services (AWS RDS, Azure Database, etc.)
- Store `DATABASE_URL` as environment variable or in secrets manager
- Rotate passwords regularly
- Use different credentials for each environment

### 3. Environment Variables

**Best Practices:**
```bash
# ✅ GOOD: Use environment variables
DATABASE_URL=postgresql://user:password@host:5432/db

# ❌ BAD: Hardcode in Python files
DATABASE_URL = "postgresql://user:password@host:5432/db"
```

**For Production:**
- Use secrets management services:
  - AWS Secrets Manager
  - Azure Key Vault
  - HashiCorp Vault
  - Environment variables in deployment platform

### 4. SQL Scripts

**Never include real passwords in SQL scripts:**
```sql
-- ❌ BAD
CREATE USER lamla_user WITH PASSWORD 'hardcoded_password';

-- ✅ GOOD
CREATE USER lamla_user WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
-- Then replace with actual password when running
```

### 5. Password Generation

**Generate secure passwords:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 6. File Permissions

**Ensure sensitive files have restricted permissions:**
```bash
# Linux/Mac
chmod 600 .env

# Windows: Right-click → Properties → Security → Restrict access
```

### 7. Code Review Checklist

Before committing, check:
- [ ] No passwords in code
- [ ] No API keys in source files
- [ ] `.env` files are in `.gitignore`
- [ ] SQL scripts use placeholders
- [ ] Documentation doesn't contain real credentials

### 8. Production Deployment

**Required:**
- Use environment variables for all secrets
- Enable SSL/TLS for database connections
- Use strong, unique passwords
- Enable database connection encryption
- Use least-privilege database users
- Regular security audits
- Monitor for credential leaks

## Quick Security Audit

Run this to check for accidentally committed secrets:

```bash
# Check for common password patterns
grep -r "password.*=" --include="*.py" --include="*.sql" backend/

# Check git history for secrets (if using git-secrets)
git secrets --scan

# Check for .env files in git
git ls-files | grep "\.env$"
```

## Incident Response

If credentials are accidentally committed:

1. **Immediately rotate all exposed credentials**
2. **Remove from git history** (if possible):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Notify team members**
4. **Review access logs**
5. **Update security practices**

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [12 Factor App - Config](https://12factor.net/config)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
