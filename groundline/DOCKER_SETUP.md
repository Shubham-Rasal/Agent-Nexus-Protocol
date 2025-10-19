# 🐳 Docker Self-Hosting Guide

This guide will help you self-host the entire Groundline platform using Docker Compose, including Memgraph database, Memgraph Lab, and the Next.js web application.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker** (version 20.10 or higher)
  - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0 or higher)
  - Usually comes with Docker Desktop
  - Verify: `docker compose version`
- **At least 4GB of free RAM**
- **At least 10GB of free disk space**

## 🚀 Quick Start

### 1. Clone the Repository (if not already done)

```bash
git clone <repository-url>
cd groundline
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file and set your configuration:

```env
# Required: OpenAI API Key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Optional: Lit Protocol Network (defaults to datil-dev)
LIT_NETWORK=datil-dev

# Memgraph is pre-configured in docker-compose.yml
```

**Important:** Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Update Next.js Configuration

Before building, we need to enable standalone output for Docker. Edit `site/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  nodeMiddleware: true,
};

export default nextConfig;
```

### 4. Build and Start Services

```bash
# Build and start all services
docker compose up -d

# Or, to see logs in real-time:
docker compose up
```

This will:
- Pull the Memgraph and Memgraph Lab images
- Build the Next.js application
- Start all services
- Create persistent volumes for data

**First-time build may take 5-10 minutes depending on your internet speed.**

### 5. Access the Applications

Once all services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Main Site** | http://localhost:3000 | Your Next.js application |
| **Memgraph Lab** | http://localhost:3001 | Database visualization and query UI |
| **Memgraph** | bolt://localhost:7687 | Database connection (for clients) |

## 🔧 Common Commands

### Check Service Status

```bash
docker compose ps
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f site
docker compose logs -f memgraph
docker compose logs -f memgraph-lab
```

### Stop Services

```bash
# Stop all services (keeps data)
docker compose stop

# Stop and remove containers (keeps data in volumes)
docker compose down

# Stop and remove everything including volumes (⚠️ deletes all data)
docker compose down -v
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart site
```

### Rebuild After Code Changes

```bash
# Rebuild site after making changes
docker compose up --build -d site

# Or rebuild everything
docker compose up --build -d
```

## 🗄️ Data Persistence

All data is stored in Docker volumes:

- `memgraph-data`: Database data
- `memgraph-log`: Database logs
- `memgraph-etc`: Database configuration
- `site-uploads`: Uploaded files

### Backup Your Data

```bash
# Backup Memgraph data
docker run --rm -v groundline_memgraph-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/memgraph-backup-$(date +%Y%m%d).tar.gz /data

# List volumes
docker volume ls | grep groundline
```

### Restore Data

```bash
# Restore Memgraph data
docker run --rm -v groundline_memgraph-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/memgraph-backup-YYYYMMDD.tar.gz -C /
```

## 🔍 Troubleshooting

### Service Won't Start

1. **Check logs:**
   ```bash
   docker compose logs [service-name]
   ```

2. **Check if ports are already in use:**
   ```bash
   # On Linux/Mac
   lsof -i :3000
   lsof -i :3001
   lsof -i :7687
   
   # On Windows
   netstat -ano | findstr :3000
   ```

3. **Restart Docker daemon:**
   ```bash
   # Linux
   sudo systemctl restart docker
   
   # Mac/Windows: Restart Docker Desktop
   ```

### Memgraph Connection Issues

If the site can't connect to Memgraph:

1. Check Memgraph is healthy:
   ```bash
   docker compose ps memgraph
   ```

2. Test connection manually:
   ```bash
   docker compose exec memgraph mgconsole
   ```

3. Check environment variables:
   ```bash
   docker compose exec site env | grep NEO4J
   ```

### Site Build Fails

1. **Clean rebuild:**
   ```bash
   docker compose down
   docker compose build --no-cache site
   docker compose up -d
   ```

2. **Check Node.js version:**
   The Dockerfile uses Node 20. If you need a different version, edit `site/Dockerfile`.

### Out of Memory

If builds fail with memory errors:

1. **Increase Docker memory:**
   - Docker Desktop → Settings → Resources → Memory
   - Allocate at least 4GB

2. **Clear Docker cache:**
   ```bash
   docker system prune -a
   ```

### Permission Issues

If you encounter permission errors:

```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Or run with sudo (not recommended for production)
sudo docker compose up -d
```

## 🔐 Production Deployment

For production deployments, consider these additional steps:

### 1. Use Environment Variables Securely

Never commit `.env` files. Use Docker secrets or a secrets management service.

### 2. Enable HTTPS

Use a reverse proxy like Nginx or Traefik:

```yaml
# Example nginx config
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Configure Firewall

```bash
# Allow only necessary ports
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 4. Set Up Automated Backups

```bash
# Add to crontab
0 2 * * * docker run --rm -v groundline_memgraph-data:/data -v /backups:/backup \
  alpine tar czf /backup/memgraph-$(date +\%Y\%m\%d).tar.gz /data
```

### 5. Monitor Resources

```bash
# View resource usage
docker stats

# Set resource limits in docker-compose.yml
services:
  site:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 6. Enable Authentication for Memgraph

Edit `docker-compose.yml` to add authentication:

```yaml
services:
  memgraph:
    environment:
      - MEMGRAPH_USER=admin
      - MEMGRAPH_PASSWORD=your-secure-password
```

## 📊 Monitoring

### Health Checks

Services have built-in health checks:

```bash
# Check health status
docker compose ps

# View health check logs
docker inspect groundline-site --format='{{json .State.Health}}' | jq
```

### Resource Usage

```bash
# Real-time resource monitoring
docker stats groundline-site groundline-memgraph

# Disk usage
docker system df
```

## 🔄 Updates

### Update Docker Images

```bash
# Pull latest images
docker compose pull

# Restart with new images
docker compose up -d
```

### Update Application Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up --build -d
```

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker compose logs -f`
2. Verify environment variables: `cat .env`
3. Check Docker resources: `docker system df`
4. Review Docker version: `docker --version`
5. Open an issue on GitHub with:
   - Error messages
   - Output of `docker compose logs`
   - Your environment (OS, Docker version)

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Memgraph Documentation](https://memgraph.com/docs)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)

## 🎉 Success!

If all services are running and accessible, congratulations! Your Groundline platform is now self-hosted and ready to use.

Visit http://localhost:3000 to start using the application.

