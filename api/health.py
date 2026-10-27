import json
import os
from http.server import BaseHTTPRequestHandler
import psycopg2

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        payload = {"ok": True, "service": "Project Physique 40 API", "route": "/api/health"}
        status = 200
        try:
            conn = psycopg2.connect(
                host=os.environ["DB_HOST"],
                port=int(os.getenv("DB_PORT", "5432")),
                dbname=os.environ["DB_NAME"],
                user=os.environ["DB_USER"],
                password=os.environ["DB_PASS"],
                connect_timeout=5,
                sslmode=os.getenv("DB_SSLMODE", "require"),
            )
            with conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT current_database(), NOW()")
                    db, checked_at = cur.fetchone()
            conn.close()
            payload.update({"database_connected": True, "database": db, "checked_at": checked_at.isoformat()})
        except KeyError:
            status = 503
            payload.update({"database_connected": False, "error": "Missing Vercel DB environment variables"})
        except Exception:
            status = 503
            payload.update({"database_connected": False, "error": "Database connection failed; check DB environment variables and database network access"})
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
