# DigitalOcean Infrastructure & Deployment Guide 🌊
### Credit Optimization, Deployment Topology, and Privacy Guarantees

---

## 1. Executive Summary & Privacy Principles

iNSIGHT is architected as a **local-first** application where private webcam streams, real-time hand landmark arrays, and personal user corrections execute strictly on the client machine.

For public hackathon evaluation, community documentation, and benchmark showcases, iNSIGHT can be deployed to DigitalOcean infrastructure using available promotional credits.

> [!IMPORTANT]
> **Billing & Credit Separation Principle**:
> DigitalOcean credits apply exclusively to DigitalOcean infrastructure services (Droplets, App Platform, Managed Databases, Container Registry, Spaces Storage).
> DigitalOcean credits **DO NOT** pay for Google Gemini API cloud usage or third-party cloud LLM tokens. Gemini API billing is entirely managed through Google AI Studio / Google Cloud.

---

## 2. Infrastructure Comparison & Cost Optimization

| Deployment Topology | Target DO Service | Specs | Estimated Cost | Credit Eligible? | Best Use Case |
|---|---|---|---|:---:|---|
| **Option A (Recommended)** | **DO App Platform** | Basic-XS (512MB RAM, 1 vCPU) | **$5.00 / month** | **YES** | Public web interface, documentation, model status dashboard, pre-computed benchmarks. |
| **Option B** | **DO Droplet** | Basic Regular (2GB RAM, 1 vCPU, 50GB SSD) | **$12.00 / month** | **YES** | Standalone showcase backend with Docker Compose and persistent SQLite volume. |
| **Option C (Avoid)** | **GPU Droplet** | Dedicated GPU (8 vCPU, 32GB RAM, RTX 6000) | **$500+ / month** | **NO** | Unnecessary cost drain. Use local Apple Silicon MLX or CPU quantization for development. |

---

## 3. Option A: DigitalOcean App Platform Deployment

The repository includes a ready-to-deploy `.do/app.yaml` specification.

### Deployment Steps:
1. **Push to GitHub**:
   Ensure all changes are synchronized on the `main` branch.
2. **Deploy via DigitalOcean CLI (`doctl`)**:
   ```bash
   # Initialize doctl authentication (Do NOT commit DO_API_TOKEN)
   doctl auth init

   # Create and launch application from spec
   doctl apps create --spec .do/app.yaml
   ```
3. **Automated Continuous Deployment**:
   App Platform triggers automatic rebuilds on git pushes to `main`.
   The multi-stage `Dockerfile` compiles the React 18 SPA and launches the FastAPI service on port 8000.

---

## 4. Option B: DigitalOcean Droplet with Docker Compose

To deploy on a standard Ubuntu 24.04 Droplet:

```bash
# 1. SSH into Droplet
ssh root@your_droplet_ip

# 2. Clone repository & checkout main
git clone https://github.com/sukrutdusane/insight.git
cd insight

# 3. Create uncommitted local .env
cp .env.example .env
nano .env

# 4. Launch with Docker Compose
docker compose up -d --build

# 5. Verify deployment health
curl http://localhost:8000/api/health
```

---

## 5. Scaling Strategy & Decommissioning

### Scaling Strategy:
- **Horizontal Scaling**: Scale App Platform instance count to 2–3 instances during judging or high traffic events.
- **Static Asset Offloading**: Compiled frontend assets (`frontend/dist/assets/`) can be offloaded to DigitalOcean Spaces CDN for global edge caching.

### Cleanup & Cost Termination Procedure:
When the demonstration period concludes, terminate resources to halt credit consumption:
```bash
# Delete App Platform application
doctl apps list
doctl apps delete <app_id> --force

# Or destroy Droplet
doctl compute droplet delete <droplet_id> --force
```

---

## 6. Secret Management Rules
- Never expose or commit `DO_API_TOKEN` or `DO_APP_ID`.
- Store tokens strictly in secure environment variables or CI/CD secret vaults (e.g. GitHub Repository Secrets).
