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


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SignBridge local backend...")
    # Initialize SQLite database
    init_db()
    logger.info("Local SQLite database initialized.")
    yield
    logger.info("Shutting down SignBridge local backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="SignBridge is a local-first, multimodal AI-powered Indian Sign Language communication assistant combining computer vision, locally trained gesture-recognition models, and Google's open-weight Gemma 4 models. It translates supported sign-language gestures into readable and audible communication while using multimodal visual reasoning and contextual language intelligence to assist recognition and improve accessibility.",
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
