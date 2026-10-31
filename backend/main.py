"""SignBridge FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database.connection import init_db
from backend.api.routes import health, gesture, translation, speech, history, gemma, dataset, languages
from backend.api import websocket

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("signbridge")


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing %s local backend...", settings.APP_NAME)
    # Validate environment settings
    settings.validate_configuration()
    # Initialize SQLite database
    init_db()
    logger.info("Local SQLite database initialized.")
    yield
    logger.info("Shutting down %s local backend...", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="iNSIGHT is a local-first, multimodal AI-powered sign language communication and intelligence platform combining computer vision, locally trained gesture-recognition models, and Google's open-weight Gemma 4 models. It translates supported sign-language gestures into readable and audible communication while using multimodal visual reasoning and contextual language intelligence to assist recognition and improve accessibility.",
    lifespan=lifespan
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="/api")
app.include_router(gesture.router, prefix="/api")
app.include_router(translation.router, prefix="/api")
app.include_router(speech.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(gemma.router, prefix="/api")
app.include_router(dataset.router, prefix="/api")
app.include_router(languages.router, prefix="/api")
app.include_router(websocket.router)

# Mount compiled React frontend in production / container environments
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST.exists() and (FRONTEND_DIST / "index.html").exists():
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("ws"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/")
    async def root():
        return {
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
