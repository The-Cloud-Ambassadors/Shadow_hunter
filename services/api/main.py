import os
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from contextlib import asynccontextmanager

from services.api.routers import discovery, policy

# Module-level mode flag (set by run_local.py)
_live_mode = False

def set_live_mode(val: bool):
    global _live_mode
    _live_mode = val

def get_live_mode() -> bool:
    return _live_mode

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Control Plane API starting...")
    yield
    logger.info("Control Plane API shutting down...")

app = FastAPI(
    title="Shadow Hunter Control Plane",
    version="0.1.0",
    description="API for managing Shadow Hunter security platform",
    lifespan=lifespan
)

# Enable CORS for dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(discovery.router, prefix="/v1/discovery", tags=["Discovery"])
app.include_router(policy.router, prefix="/v1/policy", tags=["Policy"])

try:
    from services.api.routers import chat
    app.include_router(chat.router, prefix="/v1/chat", tags=["Chat"])
except ImportError as e:
    logger.warning(f"Chat router not loaded: {e}")

try:
    from services.api.routers import reporting
    app.include_router(reporting.router, prefix="/v1/reporting", tags=["Reporting"])
except ImportError as e:
    logger.warning(f"Reporting router not loaded: {e}")

try:
    from services.api.routers import defense
    app.include_router(defense.router, prefix="/v1/defense", tags=["Defense"])
except ImportError as e:
    logger.warning(f"Defense router not loaded: {e}")

try:
    from services.api.routers import compliance
    app.include_router(compliance.router, prefix="/v1/compliance", tags=["Compliance"])
except ImportError as e:
    logger.warning(f"Compliance router not loaded: {e}")

try:
    from services.api.routers import mitre
    app.include_router(mitre.router, prefix="/v1/mitre", tags=["MITRE"])
except ImportError as e:
    logger.warning(f"MITRE router not loaded: {e}")

try:
    from services.api.routers import copilot
    app.include_router(copilot.router, prefix="/v1/copilot", tags=["Copilot"])
except ImportError as e:
    logger.warning(f"Copilot router not loaded: {e}")

# ── API Key Authentication Middleware ──
# Protects write operations. Read endpoints remain open.
API_KEY = os.environ.get("SH_API_KEY", "shadow-hunter-dev")
OPEN_PATHS = {"/health", "/ws", "/docs", "/openapi.json", "/redoc", "/v1/chat/query"}

@app.middleware("http")
async def api_key_auth(request: Request, call_next):
    # Allow GET requests, OPTIONS (for CORS preflight), and open paths
    if request.method in ("GET", "OPTIONS") or request.url.path in OPEN_PATHS:
        return await call_next(request)

    # Require API key for write operations
    key = request.headers.get("X-API-Key")
    if key != API_KEY:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or missing API key. Set X-API-Key header."}
        )
    return await call_next(request)

@app.get("/health")
async def health_check():
    return {"status": "ok", "component": "control-plane"}

@app.get("/v1/status")
async def system_status():
    return {"mode": "live" if _live_mode else "demo"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    from services.api.transceiver import manager
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        manager.disconnect(websocket)

# ── Serve React Dashboard (Production / Cloud Run) ──
# When the Dockerfile builds the frontend, it places the output in /app/static.
# This block serves those files so the dashboard loads from the same URL as the API.
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "static")

if os.path.isdir(STATIC_DIR):
    logger.info(f"Serving React dashboard from {STATIC_DIR}")
    # Mount static assets (JS, CSS, images) under /assets
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Catch-all route: serve index.html for any non-API path (SPA routing)."""
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Dashboard not found"})
else:
    logger.info("No static directory found — frontend must be served separately (dev mode)")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

