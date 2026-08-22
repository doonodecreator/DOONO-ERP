from pathlib import Path
import re

try:
    import yaml
except ImportError as exc:
    raise SystemExit(f"PyYAML is required: {exc}")

root = Path(__file__).resolve().parents[1]
text = (root / "render.yaml").read_text()
config = yaml.safe_load(text)
assert isinstance(config, dict), "render.yaml must be a mapping"
services = config.get("services", [])
names = {service.get("name") for service in services}
required = {"dono-api", "dono-frontend", "dono-worker", "dono-subscription-expiry", "dono-subscription-reminders"}
missing = required - names
assert not missing, f"Missing services: {sorted(missing)}"
assert config.get("databases", [{}])[0].get("name") == "dono-db", "Missing dono-db database"
api = next(service for service in services if service.get("name") == "dono-api")
frontend = next(service for service in services if service.get("name") == "dono-frontend")
assert api.get("runtime") == "docker" and api.get("healthCheckPath") == "/up"
assert "backend/dono-api" in api.get("preDeployCommand", "") or api.get("dockerfilePath") == "./Dockerfile"
assert frontend.get("runtime") == "static"
assert frontend.get("staticPublishPath") == "frontend/dist"
assert any(route.get("source") == "/*" and route.get("destination") == "/index.html" for route in frontend.get("routes", []))
assert "PAYSTACK_SECRET_KEY" in {item.get("key") for item in api.get("envVars", [])}
assert "sync: false" in text
assert not re.search(r"(sk_live_|sk_test_|AKIA[0-9A-Z]{16}|password:\s*[^$])", text, re.I), "Possible hardcoded secret found"
print(f"render.yaml valid: {len(services)} services, {len(config.get('databases', []))} database")
