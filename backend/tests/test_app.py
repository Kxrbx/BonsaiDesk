from __future__ import annotations

import importlib
import os
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


def build_client(home: Path) -> TestClient:
    os.environ["BONSAI_DESK_HOME"] = str(home)

    import app.api.routes_chat as routes_chat_mod
    import app.api.routes_conversations as routes_conversations_mod
    import app.api.routes_models as routes_models_mod
    import app.api.routes_runtime as routes_runtime_mod
    import app.core.config as config_mod
    import app.main as main_mod
    import app.services as services_mod

    importlib.reload(config_mod)
    importlib.reload(services_mod)
    importlib.reload(routes_chat_mod)
    importlib.reload(routes_conversations_mod)
    importlib.reload(routes_models_mod)
    importlib.reload(routes_runtime_mod)
    importlib.reload(main_mod)
    return TestClient(main_mod.app)


class AppRoutesTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.home = Path(self.temp_dir.name)
        self.original_path = os.environ.get("PATH", "")
        self.client = build_client(self.home)

    def tearDown(self) -> None:
        self.client.close()
        try:
            self.temp_dir.cleanup()
        except PermissionError:
            pass
        os.environ["PATH"] = self.original_path
        os.environ.pop("BONSAI_DESK_HOME", None)
        os.environ.pop("PRISM_LAUNCHER_HOME", None)

    def test_runtime_overview_returns_expected_shape(self) -> None:
        response = self.client.get("/api/runtime/overview")
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()

        self.assertIn("status", payload)
        self.assertIn("config", payload)
        self.assertIn("models", payload)
        self.assertIn("install_progress", payload)
        self.assertIn("sources", payload)
        self.assertIn("diagnostics", payload)
        self.assertEqual(payload["config"]["model_filename"], "Bonsai-8B.gguf")
        self.assertEqual(payload["config"]["model_variant"], "8B")
        self.assertGreaterEqual(len(payload["models"]), 3)
        self.assertEqual(payload["models"][0]["id"], "prism-ml/Bonsai-8B-gguf")
        self.assertGreaterEqual(len(payload["sources"]), 2)
        self.assertGreaterEqual(len(payload["diagnostics"]["checks"]), 1)

    def test_runtime_config_and_conversation_flow(self) -> None:
        config = self.client.get("/api/runtime/config").json()
        config["temperature"] = 0.61
        config["top_k"] = 31
        config["min_p"] = 0.08
        config["reasoning_budget"] = 96
        config["enable_thinking"] = True

        saved = self.client.put("/api/runtime/config", json=config)
        self.assertEqual(saved.status_code, 200, saved.text)
        self.assertEqual(saved.json()["reasoning_budget"], -1)

        overview = self.client.get("/api/runtime/overview")
        self.assertEqual(overview.status_code, 200, overview.text)
        overview_payload = overview.json()
        self.assertEqual(overview_payload["config"]["top_k"], 31)
        self.assertEqual(overview_payload["config"]["reasoning_budget"], -1)
        self.assertTrue(overview_payload["config"]["enable_thinking"])

        created = self.client.post("/api/conversations", json={})
        self.assertEqual(created.status_code, 200, created.text)
        conversation_id = created.json()["id"]

        fetched = self.client.get(f"/api/conversations/{conversation_id}")
        self.assertEqual(fetched.status_code, 200, fetched.text)

        renamed = self.client.patch(
            f"/api/conversations/{conversation_id}",
            json={"title": "Runtime tuning"},
        )
        self.assertEqual(renamed.status_code, 200, renamed.text)
        self.assertEqual(renamed.json()["title"], "Runtime tuning")

        deleted = self.client.delete(f"/api/conversations/{conversation_id}")
        self.assertEqual(deleted.status_code, 200, deleted.text)

        missing = self.client.get(f"/api/conversations/{conversation_id}")
        self.assertEqual(missing.status_code, 404, missing.text)

    def test_model_descriptor_does_not_fallback_to_unconfigured_gguf(self) -> None:
        models_dir = self.home / "models"
        models_dir.mkdir(parents=True, exist_ok=True)
        (models_dir / "some-other-model.gguf").write_text("stub", encoding="utf-8")

        config = self.client.get("/api/runtime/config").json()
        config["model_filename"] = "Configured-Only.gguf"
        saved = self.client.put("/api/runtime/config", json=config)
        self.assertEqual(saved.status_code, 200, saved.text)

        models = self.client.get("/api/models")
        self.assertEqual(models.status_code, 200, models.text)
        payload = models.json()[0]
        self.assertEqual(payload["filename"], "Configured-Only.gguf")
        self.assertFalse(payload["installed"])
        self.assertIsNone(payload["local_path"])

    def test_select_model_variant_updates_active_model(self) -> None:
        selected = self.client.post("/api/models/select", json={"variant": "4B"})
        self.assertEqual(selected.status_code, 200, selected.text)
        payload = selected.json()
        self.assertEqual(payload["config"]["model_variant"], "4B")
        self.assertEqual(payload["config"]["model_filename"], "Bonsai-4B.gguf")
        active_models = [model for model in payload["models"] if model["is_active"]]
        self.assertEqual(len(active_models), 1)
        self.assertEqual(active_models[0]["variant"], "4B")

        models = self.client.get("/api/models")
        self.assertEqual(models.status_code, 200, models.text)
        model_payload = models.json()
        self.assertGreaterEqual(len(model_payload), 3)
        self.assertEqual([model["variant"] for model in model_payload if model["is_active"]], ["4B"])

    def test_runtime_diagnostics_endpoint_returns_checks(self) -> None:
        response = self.client.get("/api/runtime/diagnostics")
        self.assertEqual(response.status_code, 200, response.text)
        payload = response.json()
        self.assertIn("platform_label", payload)
        self.assertIn("runtime_version", payload)
        self.assertGreaterEqual(len(payload["checks"]), 1)

    def test_new_home_uses_bonsai_database_name(self) -> None:
        config = self.client.get("/api/runtime/config")
        self.assertEqual(config.status_code, 200, config.text)
        self.assertTrue((self.home / "bonsai_desk.db").exists())
        self.assertFalse((self.home / "prism_launcher.db").exists())

    def test_use_existing_assets_links_local_runtime_and_model(self) -> None:
        runtime_path = self.home / "custom-runtime" / "llama-server.exe"
        runtime_path.parent.mkdir(parents=True, exist_ok=True)
        runtime_path.write_text("stub", encoding="utf-8")

        model_path = self.home / "external-models" / "Bonsai-8B.gguf"
        model_path.parent.mkdir(parents=True, exist_ok=True)
        model_path.write_text("stub", encoding="utf-8")

        linked = self.client.post(
            "/api/runtime/use-existing-assets",
            json={
                "runtime_binary_path": str(runtime_path),
                "model_file_path": str(model_path),
            },
        )
        self.assertEqual(linked.status_code, 200, linked.text)
        payload = linked.json()
        self.assertEqual(payload["status"]["runtime_source"], "linked-local")
        self.assertEqual(payload["status"]["model_source"], "linked-local")
        self.assertEqual(payload["status"]["binary_path"], str(runtime_path))
        self.assertEqual(payload["status"]["model_path"], str(model_path))
        self.assertEqual(payload["config"]["runtime_binary_path"], str(runtime_path))
        self.assertEqual(payload["config"]["model_file_path"], str(model_path))
        self.assertEqual(payload["config"]["model_filename"], "Bonsai-8B.gguf")

if __name__ == "__main__":
    unittest.main()
