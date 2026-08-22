from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / "src"
changed = []
pattern = re.compile(r"<button\b(?P<attrs>[^>]*?onClick\s*=.*?)(?<!type=)>", re.S)
for path in root.rglob("*.jsx"):
    original = path.read_text()
    def add_type(match):
        attrs = match.group("attrs")
        if re.search(r"\btype\s*=", attrs):
            return match.group(0)
        return f'<button type="button"{attrs}>'
    updated = pattern.sub(add_type, original)
    if updated != original:
        path.write_text(updated)
        changed.append(str(path))
print(f"Updated {len(changed)} files")
for path in changed:
    print(path)
