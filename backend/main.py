import os
from datetime import datetime
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import Client, create_client

load_dotenv()

app = FastAPI(title="Gazodoro Focus Session API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class FocusResetLog(BaseModel):
    session_id: str = Field(min_length=1)
    user_id: str | None = None
    started_at: datetime | None = None
    reset_at: datetime | None = None
    focus_duration_sec: float = Field(ge=0)
    reset_reason: Literal["manual_reset"]
    source: Literal["pomodoro_test"]


class GazeTrackingSample(BaseModel):
    session_id: str = Field(min_length=1)
    user_id: str | None = None
    captured_at: datetime | None = None
    x: float
    y: float
    viewport_width: int | None = Field(default=None, ge=1)
    viewport_height: int | None = Field(default=None, ge=1)
    confidence: float | None = Field(default=None, ge=0, le=1)
    source: Literal["pomodoro_test"] = "pomodoro_test"
    camera_mode: bool = True


class GazeTrackingBatch(BaseModel):
    samples: list[GazeTrackingSample] = Field(min_length=1, max_length=200)


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_secret_key = os.getenv("SUPABASE_SECRET_KEY")

    if not supabase_url or not supabase_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Supabase environment variables are not configured.",
        )

    return create_client(supabase_url, supabase_secret_key)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/log/focus-reset")
def log_focus_reset(payload: FocusResetLog) -> dict[str, object]:
    row = payload.model_dump(mode="json")

    try:
        result = (
            get_supabase_client()
            .table("pomodoro_focus_sessions")
            .insert(row)
            .execute()
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail="Failed to insert focus reset log.") from error

    return {"status": "logged", "data": result.data}


@app.post("/log/gaze-samples")
def log_gaze_samples(payload: GazeTrackingBatch) -> dict[str, object]:
    rows = [sample.model_dump(mode="json") for sample in payload.samples]

    try:
        result = (
            get_supabase_client()
            .table("gaze_tracking_samples")
            .insert(rows)
            .execute()
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail="Failed to insert gaze tracking samples.") from error

    return {"status": "logged", "count": len(rows), "data": result.data}
