import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, posts, profile, style_samples, weeks, video
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)

app = FastAPI(
    title="PostWeek API",
    description="Generate a week of LinkedIn posts in your own voice. By Wisdom.",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV == "development" else None,
    redoc_url="/redoc" if settings.APP_ENV == "development" else None,
)

origins = [settings.FRONTEND_URL]
if settings.APP_ENV == "development":
    origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
else:
    # Production — allow the DuckDNS domain and direct IP access
    origins += [
        "http://postweek.duckdns.org",
        "http://3.22.119.126",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(style_samples.router)
app.include_router(weeks.router)
app.include_router(posts.router)
app.include_router(video.router)


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "ok", "service": "PostWeek by Wisdom"}
