# 🚀 Quick Start Guide - Docker Self-Hosting

Get Groundline up and running in **5 minutes** with Docker!

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

## One-Command Setup

```bash
./scripts/start-docker.sh
```

The script will guide you through:
1. ✅ Checking Docker installation
2. 🔧 Creating environment configuration
3. 🏗️ Building and starting all services
4. ✨ Verifying everything is running

## Manual Setup (Alternative)

If you prefer manual setup:

### 1. Create Environment File

```bash
cp env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### 2. Start Services

```bash
docker compose up -d
```

### 3. Access Applications

- **Main Application**: http://localhost:3000
- **Memgraph Lab**: http://localhost:3001
- **Database**: bolt://localhost:7687

## 🎯 What Gets Installed

| Service | Description | Port |
|---------|-------------|------|
| **site** | Next.js web application | 3000 |
| **memgraph** | Graph database | 7687, 7444 |
| **memgraph-lab** | Database UI | 3001 |

## 📊 Check Status

```bash
# View running services
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f site
```

## 🛑 Stop Services

```bash
# Quick stop (preserves data)
docker compose down

# Or use the helper script
./scripts/stop-docker.sh
```

## 🔄 Restart After Code Changes

```bash
# Rebuild and restart
docker compose up --build -d

# Or restart specific service
docker compose restart site
```

## ❓ Troubleshooting

### Port Already in Use

If port 3000 is already in use, edit `docker-compose.yml`:

```yaml
services:
  site:
    ports:
      - "3002:3000"  # Change 3000 to any available port
```

### Memgraph Won't Connect

Wait 10-15 seconds after starting for Memgraph to initialize:

```bash
# Check if healthy
docker compose ps memgraph
```

### Build Fails

Clear Docker cache and rebuild:

```bash
docker compose down
docker system prune -a  # Warning: removes all unused Docker data
docker compose up --build -d
```

## 📚 Full Documentation

For detailed configuration, production deployment, backups, and more:

👉 **[Read DOCKER_SETUP.md](DOCKER_SETUP.md)**

## 🆘 Need Help?

1. Check logs: `docker compose logs -f`
2. Verify environment: `cat .env`
3. Test individual services:
   ```bash
   docker compose up memgraph  # Start just database
   ```
4. Open an issue on GitHub

## ✅ Success Checklist

- [ ] Docker is running
- [ ] `.env` file contains valid OPENAI_API_KEY
- [ ] All services show "Up" in `docker compose ps`
- [ ] http://localhost:3000 loads successfully
- [ ] http://localhost:3001 shows Memgraph Lab

## 🎉 You're Ready!

Visit **http://localhost:3000** to start using Groundline!

---

**Next Steps:**
- Upload your first dataset
- Explore the knowledge graph in Memgraph Lab
- Check out the API documentation
- Configure production deployment (see DOCKER_SETUP.md)

