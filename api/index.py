"""Project Physique 40 API with PostgreSQL-backed durable storage."""
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import psycopg2
from psycopg2.extras import Json, RealDictCursor
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field

app = FastAPI(title="Project Physique 40 API", docs_url=None, redoc_url=None)

def db_connection():
    # For local development these defaults match the supplied PostgreSQL details.
    # On Vercel, set DB_HOST/DB_NAME/DB_USER/DB_PASS/DB_PORT to a reachable hosted DB.
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "retail_warehouse"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS", "Welcome"),
        port=int(os.getenv("DB_PORT", "5432")),
        connect_timeout=5,
        sslmode=os.getenv("DB_SSLMODE", "prefer"),
    )

def ensure_schema(conn):
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS physique_app_state (
          session_id UUID PRIMARY KEY,
          state JSONB NOT NULL,
          revision BIGINT NOT NULL DEFAULT 1,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS physique_food_logs (
          session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
          meal TEXT, item_name TEXT, calories NUMERIC, protein NUMERIC,
          carbs NUMERIC, fat NUMERIC, entry JSONB NOT NULL,
          PRIMARY KEY(session_id, entry_id)
        );
        CREATE INDEX IF NOT EXISTS idx_physique_food_date ON physique_food_logs(session_id, entry_date);
        CREATE TABLE IF NOT EXISTS physique_saved_recipes (
          session_id UUID NOT NULL, recipe_id TEXT NOT NULL, recipe_name TEXT,
          recipe JSONB NOT NULL, PRIMARY KEY(session_id, recipe_id)
        );
        CREATE TABLE IF NOT EXISTS physique_weight_logs (
          session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
          weight NUMERIC, entry JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
        );
        CREATE TABLE IF NOT EXISTS physique_workout_logs (
          session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
          workout JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
        );
        CREATE TABLE IF NOT EXISTS physique_photo_logs (
          session_id UUID NOT NULL, entry_id TEXT NOT NULL, entry_date DATE,
          photo JSONB NOT NULL, PRIMARY KEY(session_id, entry_id)
        );
        CREATE TABLE IF NOT EXISTS physique_exercise_logs (
          session_id UUID NOT NULL, entry_id TEXT NOT NULL, exercise JSONB NOT NULL,
          PRIMARY KEY(session_id, entry_id)
        );
        CREATE TABLE IF NOT EXISTS physique_app_settings (
          session_id UUID PRIMARY KEY, settings JSONB NOT NULL,
          transformation JSONB NOT NULL DEFAULT '{}'::jsonb,
          workout_sessions JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """)
    conn.commit()

def session_id_for(request: Request) -> uuid.UUID:
    raw = request.cookies.get("physique_session")
    try:
        return uuid.UUID(raw) if raw else uuid.uuid4()
    except (ValueError, TypeError):
        return uuid.uuid4()

def set_session_cookie(response: Response, sid: uuid.UUID):
    response.set_cookie(
        "physique_session", str(sid), httponly=True, secure=True,
        samesite="lax", max_age=60 * 60 * 24 * 365 * 5, path="/"
    )

class StatePayload(BaseModel):
    state: dict[str, Any] = Field(max_length=100000)

def replace_child_rows(cur, table, sid, entries, id_key, date_key=None, json_col=None):
    cur.execute(f"DELETE FROM {table} WHERE session_id = %s", (str(sid),))
    for i, entry in enumerate(entries if isinstance(entries, list) else []):
        if not isinstance(entry, dict):
            continue
        ident = str(entry.get("id") or entry.get(id_key) or f"{i}")
        date_val = entry.get(date_key) if date_key else None
        if table == "physique_food_logs":
            cur.execute("""INSERT INTO physique_food_logs
              (session_id,entry_id,entry_date,meal,item_name,calories,protein,carbs,fat,entry)
              VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
              (str(sid),ident,date_val,entry.get("meal"),entry.get("name") or entry.get("food") or entry.get("item"),
               entry.get("calories",0),entry.get("protein",0),entry.get("carbs",0),entry.get("fat",0),Json(entry)))
        elif table == "physique_weight_logs":
            cur.execute("""INSERT INTO physique_weight_logs(session_id,entry_id,entry_date,weight,entry)
              VALUES (%s,%s,%s,%s,%s)""",
              (str(sid),ident,date_val,entry.get("weight") or entry.get("value"),Json(entry)))
        elif table == "physique_workout_logs":
            cur.execute("INSERT INTO physique_workout_logs(session_id,entry_id,entry_date,workout) VALUES (%s,%s,%s,%s)",
              (str(sid),ident,date_val,Json(entry)))
        elif table == "physique_photo_logs":
            cur.execute("INSERT INTO physique_photo_logs(session_id,entry_id,entry_date,photo) VALUES (%s,%s,%s,%s)",
              (str(sid),ident,date_val,Json(entry)))
        elif table == "physique_exercise_logs":
            cur.execute("INSERT INTO physique_exercise_logs(session_id,entry_id,exercise) VALUES (%s,%s,%s)",
              (str(sid),ident,Json(entry)))

def persist_state(conn, sid, state):
    # Full JSON snapshot is the source of truth; child tables are queryable mirrors.
    with conn.cursor() as cur:
        cur.execute("""INSERT INTO physique_app_state(session_id,state,revision,updated_at)
          VALUES (%s,%s,1,NOW())
          ON CONFLICT(session_id) DO UPDATE SET state=EXCLUDED.state,
          revision=physique_app_state.revision+1, updated_at=NOW()""", (str(sid),Json(state)))
        for table in ("physique_food_logs","physique_saved_recipes","physique_weight_logs",
                      "physique_workout_logs","physique_photo_logs","physique_exercise_logs"):
            cur.execute(f"DELETE FROM {table} WHERE session_id=%s", (str(sid),))
        for i, recipe in enumerate(state.get("recipes",[]) if isinstance(state.get("recipes",[]),list) else []):
            if isinstance(recipe,dict):
                cur.execute("INSERT INTO physique_saved_recipes(session_id,recipe_id,recipe_name,recipe) VALUES (%s,%s,%s,%s)",
                  (str(sid),str(recipe.get("id") or i),recipe.get("name"),Json(recipe)))
        replace_child_rows(cur,"physique_food_logs",sid,state.get("foods",[]),"id","date")
        replace_child_rows(cur,"physique_weight_logs",sid,state.get("weights",[]),"id","date")
        replace_child_rows(cur,"physique_workout_logs",sid,state.get("workoutHistory",state.get("workouts",[])),"id","date")
        replace_child_rows(cur,"physique_photo_logs",sid,state.get("photos",[]),"id","date")
        replace_child_rows(cur,"physique_exercise_logs",sid,state.get("exercises",[]),"id")
        cur.execute("""INSERT INTO physique_app_settings(session_id,settings,transformation,workout_sessions,updated_at)
          VALUES (%s,%s,%s,%s,NOW()) ON CONFLICT(session_id) DO UPDATE SET
          settings=EXCLUDED.settings,transformation=EXCLUDED.transformation,
          workout_sessions=EXCLUDED.workout_sessions,updated_at=NOW()""",
          (str(sid),Json(state.get("settings",{})),Json(state.get("transformation",{})),
           Json(state.get("workoutSessions",{}))))

@app.get("/")
@app.get("/health")
def health():
    try:
        with db_connection() as conn:
            ensure_schema(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT current_database(), NOW()")
                db, now = cur.fetchone()
        return {"ok": True, "database_connected": True, "database": db, "checked_at": now.isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=503, detail={"ok": False, "database_connected": False,
            "error": "PostgreSQL connection failed. Configure DB_HOST, DB_NAME, DB_USER, DB_PASS and DB_PORT."}) from exc

@app.get("/state")
def get_state(request: Request, response: Response):
    sid = session_id_for(request)
    try:
        with db_connection() as conn:
            ensure_schema(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT state,revision,updated_at FROM physique_app_state WHERE session_id=%s",(str(sid),))
                row=cur.fetchone()
        set_session_cookie(response,sid)
        if not row:
            return {"found":False,"state":None,"revision":0}
        return {"found":True,"state":row[0],"revision":row[1],"updated_at":row[2].isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Cloud database unavailable; local data has not been deleted.") from exc

@app.put("/state")
def put_state(payload: StatePayload, request: Request, response: Response):
    sid = session_id_for(request)
    try:
        with db_connection() as conn:
            ensure_schema(conn)
            persist_state(conn,sid,payload.state)
        set_session_cookie(response,sid)
        return {"ok":True,"saved":True,"session_id":str(sid),"saved_at":datetime.now(timezone.utc).isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Cloud save failed; keep the local backup and retry.") from exc

@app.get("/verify")
def verify(request: Request, response: Response):
    sid=session_id_for(request)
    try:
        with db_connection() as conn:
            ensure_schema(conn)
            with conn.cursor() as cur:
                cur.execute("SELECT revision,updated_at FROM physique_app_state WHERE session_id=%s",(str(sid),))
                snap=cur.fetchone()
                counts={}
                for table in ("physique_food_logs","physique_saved_recipes","physique_weight_logs",
                              "physique_workout_logs","physique_photo_logs","physique_exercise_logs"):
                    cur.execute(f"SELECT COUNT(*) FROM {table} WHERE session_id=%s",(str(sid),))
                    counts[table]=cur.fetchone()[0]
        set_session_cookie(response,sid)
        return {"database_connected":True,"has_saved_state":bool(snap),"revision":snap[0] if snap else 0,
                "updated_at":snap[1].isoformat() if snap else None,"table_counts":counts}
    except Exception as exc:
        raise HTTPException(status_code=503,detail="Could not verify PostgreSQL connection or saved records.") from exc

class PlanRequest(BaseModel):
    plan: str = Field(min_length=1, max_length=12000)

@app.post("/coach")
def organize_plan(request: PlanRequest):
    text = request.plan.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Provide plan text.")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="AI plan organization is not configured. Plans can still be pasted and saved manually.")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            instructions=("Organize the supplied diet or workout plan faithfully. Do not invent foods, quantities, calories, exercises, or medical claims. Flag missing quantities and unclear raw/cooked measurements. Do not recommend crash diets or promise a specific rate of fat loss. Return concise plain text."),
            input=text,
        )
        return {"organized_plan": response.output_text}
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Plan organization failed. Check server configuration and logs.") from exc
