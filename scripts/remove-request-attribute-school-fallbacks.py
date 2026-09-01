from pathlib import Path
import re

ROOT = Path('/home/ubuntu/DOONO-ERP/backend/dono-api/app')
patterns = [
    (
        re.compile(r"\$request->attributes->get\('current_school_id'\)\s*\?\?\s*\$this->context->currentSchool\(\$request->user\(\)\)\?->id"),
        "$this->context->currentSchool($request->user())?->id",
    ),
    (
        re.compile(r"\$request->attributes->get\('current_school_id'\)\s*\?\?\s*\$this->context->currentSchool\(\$user\)\?->id"),
        "$this->context->currentSchool($user)?->id",
    ),
    (
        re.compile(r"\$this->attributes->get\('current_school_id'\)\s*\?\?\s*app\(CurrentContextService::class\)->currentSchool\(\$this->user\(\)\)\?->id"),
        "app(CurrentContextService::class)->currentSchool($this->user())?->id",
    ),
]
changed = []
for path in sorted(ROOT.rglob('*.php')):
    if 'current_school_id' not in path.read_text(errors='ignore'):
        continue
    original = path.read_text()
    updated = original
    for pattern, replacement in patterns:
        updated = pattern.sub(replacement, updated)
    if updated != original:
        path.write_text(updated)
        changed.append(path)

print(f'Updated {len(changed)} canonical PHP files')
for path in changed:
    print(path)
