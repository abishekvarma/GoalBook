"""Optional server-side plan organizer. API secrets must stay in deployment env vars."""
import json
import os
from http.server import BaseHTTPRequestHandler
from typing import Any

try:
    from openai import OpenAI
except ImportError:  # App can still deploy without AI enabled.
    OpenAI = None


class handler(BaseHTTPRequestHandler):
    def _reply(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._reply(200, {"ok": True, "service": "Project Physique 40 API", "ai_enabled": bool(os.getenv("OPENAI_API_KEY"))})

    def do_POST(self) -> None:
        if self.path != "/api/coach":
            self._reply(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 20000:
                self._reply(413, {"error": "Request must be between 1 byte and 20 KB"})
                return
            payload = json.loads(self.rfile.read(length))
        except (ValueError, json.JSONDecodeError):
            self._reply(400, {"error": "Invalid JSON request"})
            return
        text = payload.get("plan", "")
        if not isinstance(text, str) or not text.strip() or len(text) > 12000:
            self._reply(400, {"error": "Provide plan text up to 12 KB"})
            return
        if not os.getenv("OPENAI_API_KEY") or OpenAI is None:
            self._reply(503, {"error": "AI plan organization is not configured. You can still paste and save plans manually."})
            return
        try:
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
            self._reply(200, {"organized_plan": response.output_text})
        except Exception:
            # Avoid leaking API credentials or upstream error details.
            self._reply(502, {"error": "Plan organization failed. Check server configuration and logs."})

    def log_message(self, fmt: str, *args: Any) -> None:
        return
