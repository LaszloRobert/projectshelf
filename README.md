let# 📚 Project Shelf

A clean, modern personal project management application to organize and track all your development projects in one place.

![Project Shelf Screenshot](https://via.placeholder.com/800x400?text=Project+Shelf+Screenshot)

## ✨ Features

- **Project Management**: Track projects with statuses (Planning, In Progress, Completed)
- **Multi-user Support**: Admin can create and manage multiple users
- **Clean Interface**: Modern, responsive design built with Next.js and Tailwind CSS
- **Easy Self-hosting**: Docker-ready with SQLite database
- **Secure**: JWT-based authentication with password hashing
- **Lightweight**: SQLite database, no external dependencies

## 🚀 Quick Start (Docker)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd projectshelf
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   ```

3. **Edit the `.env` file** and change the JWT_SECRET:
   ```env
   JWT_SECRET="your-super-secret-key-at-least-32-characters-long"
   ```

4. **Start the application**
   ```bash
   docker compose up -d
   ```

5. **Access the app**
   - Open http://localhost:8081
   - Login with: `admin@email.com` / `changeme`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database file path | `file:./data/projectshelf.db` |
| `JWT_SECRET` | Secret key for JWT tokens | **Must be changed!** |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Internal container port | `8080` |

### Port Configuration

To change the external port, edit `docker-compose.yml`:
```yaml
ports:
  - "9000:8080"  # App will be available on port 9000
```

### Database Options

**SQLite (Default - Recommended)**
```env
DATABASE_URL="file:./data/projectshelf.db"
```

**PostgreSQL (Advanced)**
1. Add PostgreSQL service to `docker-compose.yml`
2. Update DATABASE_URL:
```env
DATABASE_URL="postgresql://user:password@db:5432/projectshelf"
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with development settings
# DATABASE_URL="file:./dev.db"
# NODE_ENV=development
# PORT=3000

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📋 Default Admin Account

On first startup, an admin account is automatically created:
- **Email**: `admin@email.com`
- **Password**: `changeme`

⚠️ **Important**: Change the admin password after first login!

## 🔒 Security Notes

- Always change the `JWT_SECRET` in production
- Change the default admin password
- Use HTTPS in production with a reverse proxy
- Regular database backups recommended

## 📁 File Structure

```
projectshelf/
├── data/                 # Database and persistent data (created on first run)
├── src/                  # Application source code
├── prisma/              # Database schema and migrations
├── .env                 # Your configuration (create from .env.example)
├── .env.example         # Environment template
├── docker-compose.yml   # Docker configuration
├── Dockerfile          # Container definition
└── README.md           # This file
```

## 🔄 Useful Commands

```bash
# Start application
docker compose up -d

# Stop application
docker compose down

# View logs
docker compose logs -f

# Update to latest version
git pull
docker compose build --no-cache
docker compose up -d

# Backup database (SQLite)
cp data/projectshelf.db backup-$(date +%Y%m%d).db
```

## 🐛 Troubleshooting

### Port Already in Use
Change the external port in `docker-compose.yml`:
```yaml
ports:
  - "8082:8080"  # Use port 8082 instead
```

### Database Issues
Reset the database:
```bash
docker compose down
rm -rf data/
docker compose up -d
```

### Can't Access from Other Devices
- Use your server's IP address instead of localhost
- Ensure port 8081 is open in your firewall
- Check Docker port binding: `docker compose ps`

### Application Won't Start
1. Check logs: `docker compose logs -f`
2. Verify `.env` file exists and has `JWT_SECRET`
3. Ensure Docker and Docker Compose are installed
4. Check available disk space and ports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Support

If you find this project useful, please consider giving it a star! ⭐

For issues and feature requests, please use the GitHub Issues tab.

---

**Built with**: Next.js, TypeScript, Tailwind CSS, Prisma, SQLite