import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import users, workouts, exercises, goals, records, bodyweight, wellness, dashboard

load_dotenv()

app = FastAPI(title="Gym & Wellness Tracker API", version="1.0.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
app.include_router(goals.router, prefix="/goals", tags=["goals"])
app.include_router(records.router, prefix="/records", tags=["personal-records"])
app.include_router(bodyweight.router, prefix="/bodyweight", tags=["bodyweight"])
app.include_router(wellness.router, prefix="/wellness", tags=["wellness"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "gym-wellness-tracker"}
