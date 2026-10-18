import json
import os
import unittest
from unittest.mock import patch
from api.index import handler


class DummyHandler:
    path = "/api/coach"
    headers = {"Content-Length": "2"}
    wfile = None


class ApiSmokeTests(unittest.TestCase):
    def test_handler_module_loads(self):
        self.assertTrue(callable(handler))

    def test_missing_key_is_not_configured_by_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(bool(os.getenv("OPENAI_API_KEY")))


if __name__ == "__main__":
    unittest.main()
