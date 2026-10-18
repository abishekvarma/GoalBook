"""Optional server-side plan organizer. API secrets stay in deployment environment variables."""
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Project Physique 40 API", docs_url=None, redoc_url=None)

class PlanRequest(BaseModel):
    plan: str = Field(min_length=1, max_length=12000)

@app.get("/api")
@app.get("/api/health")
def health():
    return {"ok": True, "service": "Project Physique 40 API", "ai_enabled": bool(os.getenv("OPENAI_API_KEY"))}

@app.post("/api/coach")
def organize_plan(request: PlanRequest):
    text = request.plan.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Provide plan text.")
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=503, detail="AI plan organization is not configured. You can still paste and save plans manually.")
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini"),
            instructions=(
                "Organize user-provided diet or workout plan into a clear, faithful summary. "
                "Do not invent foods, quantities, calories, exercises, or medical claims. "
                "Flag missing quantities and ambiguous raw/cooked measurements. "
                "Do not recommend crash diets or promise a specific rate of fat loss. "
                "Return concise plain text."
            ),
            input=text,
        )
        return {"organized_plan": response.output_text}
    except Exception:
        # Never return API credentials or upstream exception details to the client.
        raise HTTPException(status_code=502, detail="Plan organization failed. Check server configuration and logs.")
