# AG3NT Deployment Guide

Production deployment and infrastructure setup for AG3NT.

---

## Deployment Models

AG3NT supports multiple deployment patterns:

| Model | Complexity | Scalability | Cost | Use Case |
|-------|-----------|-------------|------|----------|
| **Local** | ✅ Simple | ❌ Single user | Free | Development, personal use |
| **Docker** | 🟡 Medium | 🟡 Limited | Low | Small teams, on-premises |
| **Kubernetes** | ⚠️ Complex | ✅ Highly scalable | Medium | Enterprise, cloud |
| **Serverless** | 🟡 Medium | ✅ Auto-scale | Pay-per-use | API-only, variable load |

---

## Local Deployment (Development)

Quickest way to get started on your machine.

### Windows

```powershell
# Clone repository
git clone https://github.com/YOUR_ORG/AG3NT.git
cd AG3NT-main

# Create config
mkdir ~/.ag3nt
Copy-Item config/default-config.yaml ~/.ag3nt/config.yaml

# Create .env
@"
ANTHROPIC_API_KEY=sk_ant_your_key
AG3NT_MODEL_PROVIDER=anthropic
AG3NT_MODEL_NAME=claude-3-5-sonnet
"@ | Out-File .env

# Install dependencies
pnpm install

# Set up Python venv
cd apps/agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
cd ../..

# Start all services
.\start.ps1

# Access UI at http://localhost:3000
```

### Linux/Mac

```bash
# Clone repository
git clone https://github.com/YOUR_ORG/AG3NT.git
cd AG3NT-main

# Create config
mkdir -p ~/.ag3nt
cp config/default-config.yaml ~/.ag3nt/config.yaml

# Create .env
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk_ant_your_key
AG3NT_MODEL_PROVIDER=anthropic
AG3NT_MODEL_NAME=claude-3-5-sonnet
EOF

# Install dependencies
pnpm install

# Set up Python venv
cd apps/agent
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cd ../..

# Start all services (in separate terminals)
# Terminal 1:
cd apps/gateway && pnpm dev

# Terminal 2:
cd apps/agent && source .venv/bin/activate && python -m ag3nt_agent.worker

# Terminal 3:
cd apps/ui && pnpm dev

# Access UI at http://localhost:3000
```

---

## Docker Deployment

Containerized deployment using Docker Compose.

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# Clone repository
git clone https://github.com/YOUR_ORG/AG3NT.git
cd AG3NT-main

# Create .env
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk_ant_your_key
AG3NT_MODEL_PROVIDER=anthropic
AG3NT_MODEL_NAME=claude-3-5-sonnet

# Ports
AG3NT_GATEWAY_PORT=18789
AG3NT_AGENT_PORT=18790
EOF

# Verify docker-compose.yml exists
ls docker-compose.yml

# Build images
docker compose build

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Check health
curl http://localhost:18789/api/health
curl http://localhost:18790/health

# Access UI at http://localhost:3000

# Stop services
docker compose down
```

### Production Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    build:
      context: .
      dockerfile: apps/gateway/Dockerfile
    container_name: ag3nt-gateway
    ports:
      - "18789:18789"
    environment:
      - NODE_ENV=production
      - AG3NT_GATEWAY_HOST=0.0.0.0
      - AG3NT_GATEWAY_PORT=18789
      - AG3NT_AGENT_URL=http://agent:18790
      - LOG_LEVEL=info
    env_file:
      - .env
    volumes:
      - ag3nt-data:/home/ag3nt/.ag3nt
      - ./config:/app/config:ro
    depends_on:
      agent:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - ag3nt-net

  agent:
    build:
      context: .
      dockerfile: apps/agent/Dockerfile
    container_name: ag3nt-agent
    ports:
      - "18790:18790"
    environment:
      - PYTHONUNBUFFERED=1
      - AG3NT_AGENT_HOST=0.0.0.0
      - AG3NT_AGENT_PORT=18790
    env_file:
      - .env
    volumes:
      - ag3nt-data:/home/ag3nt/.ag3nt
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:18790/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - ag3nt-net

  ui:
    build:
      context: apps/ui
      dockerfile: Dockerfile
    container_name: ag3nt-ui
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_AG3NT_GATEWAY_URL=http://gateway:18789
      - AG3NT_GATEWAY_URL=http://gateway:18789
    depends_on:
      gateway:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - ag3nt-net

volumes:
  ag3nt-data:
    driver: local

networks:
  ag3nt-net:
    driver: bridge
```

### Docker Best Practices

1. **Use environment variables** for configuration
2. **Set resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '2'
   ```

3. **Use named volumes** for persistent data
4. **Enable health checks** for orchestration
5. **Use `restart: unless-stopped`** for resilience

---

## Kubernetes Deployment

For enterprise and high-availability setups.

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Helm (optional, for package management)

### Basic Kubernetes Manifests

#### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ag3nt
```

#### Secrets (API Keys)

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ag3nt-secrets
  namespace: ag3nt
type: Opaque
stringData:
  ANTHROPIC_API_KEY: sk_ant_your_key
  OPENAI_API_KEY: sk_...
```

#### Gateway Deployment

```yaml
# k8s/gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ag3nt-gateway
  namespace: ag3nt
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ag3nt-gateway
  template:
    metadata:
      labels:
        app: ag3nt-gateway
    spec:
      containers:
      - name: gateway
        image: ag3nt-gateway:latest
        ports:
        - containerPort: 18789
        envFrom:
        - secretRef:
            name: ag3nt-secrets
        env:
        - name: NODE_ENV
          value: production
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 18789
          initialDelaySeconds: 30
          periodSeconds: 10
```

#### Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ag3nt-gateway
  namespace: ag3nt
spec:
  type: LoadBalancer
  selector:
    app: ag3nt-gateway
  ports:
  - port: 80
    targetPort: 18789
```

### Deploy to Kubernetes

```bash
# Create namespace and secrets
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy services
kubectl apply -f k8s/gateway-deployment.yaml
kubectl apply -f k8s/service.yaml

# Check deployment
kubectl get pods -n ag3nt
kubectl describe service ag3nt-gateway -n ag3nt

# View logs
kubectl logs -n ag3nt -l app=ag3nt-gateway -f
```

---

## Cloud Deployment

### AWS

**Using ECS (Elastic Container Service)**:

1. Create ECR repositories for each service
2. Build and push images to ECR
3. Create ECS task definitions
4. Create ECS services
5. Configure load balancer (ALB)
6. Set up RDS for database (optional)

```bash
# Build and push
docker build -t ag3nt-gateway apps/gateway/
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag ag3nt-gateway:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ag3nt-gateway:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ag3nt-gateway:latest
```

### Google Cloud

**Using Cloud Run (Serverless)**:

```bash
# Deploy Gateway
gcloud run deploy ag3nt-gateway \
  --source apps/gateway/ \
  --region us-central1 \
  --set-env-vars ANTHROPIC_API_KEY=sk_ant_...
```

### Azure

**Using App Service**:

```bash
# Create resource group
az group create --name ag3nt --location eastus

# Create App Service Plan
az appservice plan create --name ag3nt-plan -g ag3nt --is-linux

# Deploy
az webapp create --resource-group ag3nt --plan ag3nt-plan --name ag3nt-gateway
```

---

## Monitoring & Observability

### Logging

1. **Application Logs**: 
   - View via `docker logs` or `kubectl logs`
   - Aggregate with ELK, Splunk, or CloudWatch

2. **Configure Logging**:
```bash
# Set log level
export LOG_LEVEL=info  # debug, info, warn, error

# Enable structured logging
export LOG_FORMAT=json
```

### Metrics

Monitor key metrics:

- **Gateway**:
  - Requests per second
  - Response time (p50, p99)
  - Error rate

- **Agent**:
  - Tool execution time
  - Memory usage
  - Token usage (cost tracking)

- **Database**:
  - Connection pool usage
  - Query latency
  - Disk usage

### Health Checks

```bash
# Gateway health
curl http://localhost:18789/api/health

# Agent health
curl http://localhost:18790/health

# Database health (via Gateway)
curl http://localhost:18789/api/health | jq .db_healthy
```

---

## Backup & Recovery

### Database Backup

```bash
# SQLite backup (local)
cp ~/.ag3nt/data.db ~/.ag3nt/data.db.backup

# PostgreSQL backup
pg_dump -U ag3nt -d ag3nt > ag3nt-backup.sql

# Restore PostgreSQL
psql -U ag3nt -d ag3nt < ag3nt-backup.sql
```

### Configuration Backup

```bash
# Backup config and secrets
zip -r ag3nt-backup.zip ~/.ag3nt/ .env

# Store safely (S3, Azure Blob, etc.)
aws s3 cp ag3nt-backup.zip s3://backup-bucket/
```

---

## SSL/TLS Certificate

For production HTTPS access:

```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/ag3nt.key \
  -out /etc/ssl/certs/ag3nt.crt

# Or use Let's Encrypt (production)
certbot certonly --standalone -d your-domain.com

# Configure Gateway to use certificate
export AG3NT_ENABLE_HTTPS=true
export AG3NT_CERT_PATH=/etc/ssl/certs/ag3nt.crt
export AG3NT_KEY_PATH=/etc/ssl/private/ag3nt.key
```

---

## Performance Tuning

### Handle High Load

1. **Increase concurrency**:
   ```yaml
   agent:
     tools:
       max_concurrent: 20
   ```

2. **Use database connection pooling**:
   ```yaml
   database:
     pool_size: 50
   ```

3. **Enable caching** (if available)

4. **Distribute with load balancer**:
   - Nginx reverse proxy
   - AWS ALB
   - Google Cloud Load Balancer

### Reduce Latency

1. **Use faster model** (GPT-3.5 instead of GPT-4)
2. **Increase infrastructure resources** (CPU, RAM)
3. **Enable caching** for repeated queries
4. **Reduce context window** (fewer tokens to process)

---

## Related Documentation

- **[CONFIGURATION.md](CONFIGURATION.md)** - Configuration reference
- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Local setup
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

