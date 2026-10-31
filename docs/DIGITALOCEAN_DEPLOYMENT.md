# DigitalOcean Deployment Guide 🌊
### Deploying SignBridge Public Documentation, Landing Page & Model Showcase

---

## 1. Overview & Privacy Guarantee

SignBridge is designed as a **local-first** application where private webcam streams, real-time hand landmark arrays, and personal user corrections execute strictly on the user's local machine.

However, for hackathon demonstration, public evaluation, and community documentation, SignBridge is fully prepared for containerized deployment to **DigitalOcean App Platform** or a **DigitalOcean Droplet**:

- **What gets hosted on DigitalOcean**:
  - The static landing page, architecture diagrams, and interactive model status dashboard.
  - Public documentation, vocabulary specifications, and dataset manifests (`/api/vocabulary`, `/api/dataset/summary`).
  - Pre-computed evaluation metrics and confusion matrices (`/api/analytics`).
- **What is NEVER hosted or uploaded to the cloud**:
  - Live webcam video feeds or raw images.
  - Private user gesture recordings.
  - Private user calibration feedback.

---

## 2. Option A: DigitalOcean App Platform (Recommended)

SignBridge includes a pre-configured `.do/app.yaml` App Platform manifest.

### One-Click Deploy via DO CLI
```bash
# 1. Install doctl and authenticate
doctl auth init

# 2. Deploy using app specification
doctl apps create --spec .do/app.yaml
```

The app specification builds a multi-stage Docker container serving the compiled React 18 production bundle and lightweight FastAPI showcase backend on port 8000.

---

## 3. Option B: DigitalOcean Droplet with Docker Compose

To deploy on a standard Ubuntu Droplet (e.g., $12/month Basic Droplet with 2GB RAM):

```bash
# 1. SSH into your DigitalOcean Droplet
ssh root@your_droplet_ip

# 2. Clone repository
git clone https://github.com/your-username/signbridge.git
cd signbridge

# 3. Launch via Docker Compose
docker compose up -d --build

# 4. Verify deployment
curl http://localhost:8000/api/health
```

The container automatically serves the frontend at `http://your_droplet_ip` and the FastAPI API at `http://your_droplet_ip/api`.

---

## 4. Environment Variables

| Variable | Default Value | Description |
|:---|:---|:---|
| `APP_NAME` | `SignBridge` | Display title for the platform |
| `DEFAULT_PROVIDER` | `local_ollama` | Inference provider (`local_ollama` or `gemini_api`) |
| `PRIMARY_LLM` | `gemma4:e4b` | Target primary model tag |
| `FALLBACK_LLM` | `gemma4:e2b` | Target fallback model tag |
| `PORT` | `8000` | HTTP service port |
