from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import todos, auth
from app.core.config import settings
from app.db.init_db import create_tables

app = FastAPI(
    title="TodoList API",
    description="API pour gérer une todolist avec authentification JWT",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(todos.router, prefix="/api", tags=["todos"])

@app.on_event("startup")
async def startup_event():
    create_tables()

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
