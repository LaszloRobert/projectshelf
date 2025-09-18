<h1 align="center">📚 Project Shelf</h1>

A way to keep your project info in one place.

<p align="center">
  <a href="https://ibb.co/1tC6nTP5"><img src="https://i.ibb.co/TxQLTt7S/demo.png" alt="demo" border="0"></a>
</p>

[![Docker Hub](https://img.shields.io/badge/dockerhub-robertls%2Fprojectshelf-0db7ed?logo=docker)](https://hub.docker.com/r/robertls/projectshelf)
[![Release](https://img.shields.io/github/v/tag/LaszloRobert/projectshelf?label=release&sort=semver)](https://github.com/LaszloRobert/projectshelf/releases)


## ✨ Features

- **Project Management**: Track projects with statuses (Planning, In Progress, Completed)
- **Multi-user Support**: Admin can create and manage multiple users
- **Clean Interface**: Modern, responsive design built with Next.js and Tailwind CSS
- **Theme Toggle**: Light and dark mode with a persistent user preference
- **Easy Self-hosting**: Docker-ready with SQLite database
- **Secure**: JWT-based authentication with password hashing
- **Lightweight**: SQLite database, no external dependencies

## 🚀 Quick Start: Self-host

```bash
docker pull robertls/projectshelf:latest
docker run -d --name projectshelf --restart unless-stopped -p 8081:8080 -v data:/app/data robertls/projectshelf:latest
```

After running
- Open `http://YOUR_SERVER_IP:8081`
- Login with `admin@email.com` / `changeme`

Port busy?
- If 8081 is in use on your host, change only the left side of the mapping (keep container port 8080):
```bash
docker run -d --name projectshelf --restart unless-stopped -p 9000:8080 -v data:/app/data robertls/projectshelf:latest
```

## Alternative Quick Start: Docker Compose (build locally)

1. Clone the repository
```bash
git clone https://github.com/LaszloRobert/projectshelf.git
cd projectshelf
```

2. Start the app
```bash
docker compose up -d
```

3. Access the app
- http://localhost:8081
- Login: admin@email.com / changeme

Advanced (Compose only)
- Change port: edit `docker-compose.yml` ports to `"9000:8080"` to serve on 9000

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


## 🧑‍💻 Development

### Prerequisites
- Node.js 18+
- npm or yarn

If you want to run from source code:

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The app will auto-generate a `.env` file with all necessary settings on first startup.

**Access the app**
- Open http://localhost:3000
- Login with admin@email.com / changeme

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | Auto-generated on startup |
| `DATABASE_URL` | Database file path | `file:./data/projectshelf.db` |

**Note**: JWT_SECRET and DATABASE_URL variables are auto-configured on first startup. You can customize them by editing the generated `.env` file.


## 📋 Default Admin Account

On first startup, an admin account is automatically created:
- **Email**: `admin@email.com`
- **Password**: `changeme`

⚠️ **Important**: Change the admin password after first login!

## 🔒 Security Notes

- JWT secrets are auto-generated securely on startup
- Change the default admin password after first login
- Use HTTPS in production with a reverse proxy
- Regular database backups recommended


### Can't Access from Other Devices
- Use your server's IP address instead of localhost
- Ensure port 8081 is open in your firewall
- Check Docker port binding: `docker compose ps`

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