# Project Shelf - Self-Hosting Guide

Project Shelf is a personal project management application that you can easily self-host using Docker.

## Prerequisites

- Docker and Docker Compose installed on your server
- Port 3000 available (or configure a different port)

## Quick Start

1. **Clone or download** this repository
2. **Copy the environment file**:
   ```bash
   cp .env.example .env
   ```
3. **Edit the `.env` file** with your preferred settings (especially change the `NEXTAUTH_SECRET`)
4. **Start the application**:
   ```bash
   docker-compose up -d
   ```
5. **Access the app** at `http://localhost:3000`

## Configuration Options

### Database Options

**SQLite (Default - Recommended for most users):**
```env
DATABASE_URL="file:./data/projectshelf.db"
```

**PostgreSQL (For advanced users):**
1. Uncomment the PostgreSQL service in `docker-compose.yml`
2. Update your `.env` file:
   ```env
   DATABASE_URL="postgresql://projectshelf:changeme123@db:5432/projectshelf"
   ```

### Port Configuration

Change the port by editing `docker-compose.yml`:
```yaml
ports:
  - "8080:8080"  # Change first number to your desired port
```

### Security

**⚠️ IMPORTANT:** Always change the `NEXTAUTH_SECRET` in your `.env` file:
```env
NEXTAUTH_SECRET="your-long-random-secret-key-here"
```

## Useful Commands

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs -f

# Update to latest version
docker-compose pull
docker-compose up -d

# Backup database (SQLite)
cp data/projectshelf.db projectshelf-backup-$(date +%Y%m%d).db
```

## File Structure

```
project-shelf/
├── data/              # Database and persistent data
├── .env               # Your configuration (create from .env.example)
├── docker-compose.yml # Docker setup
└── ...
```

## Troubleshooting

### Port already in use
Change the port in `docker-compose.yml`:
```yaml
ports:
  - "8080:8080"  # Use port 8080 instead of 3000
```

### Database issues
Reset the database:
```bash
docker-compose down
rm -rf data/
docker-compose up -d
```

### Can't access from other devices
Make sure to:
1. Use `0.0.0.0:3000` instead of `localhost:3000`
2. Update `NEXTAUTH_URL` in `.env` to your server's IP address

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Ensure all ports are available
3. Verify your `.env` configuration
4. Check Docker and Docker Compose are properly installed

---

**Enjoy organizing your projects with Project Shelf!** 🚀