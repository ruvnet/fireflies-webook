from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.config import settings
from app.database import engine, Base

app = FastAPI(title="Fireflies Webhook", version="1.0.0")

# CORS middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

# Create database tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import endpoints
from app.database import engine, Base
from app.config import Settings

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(endpoints.router)

@app.on_event("startup")
async def startup_event():
    # Initialize any startup tasks here
    pass

@app.on_event("shutdown")
async def shutdown_event():
    # Perform any cleanup tasks here
    pass
