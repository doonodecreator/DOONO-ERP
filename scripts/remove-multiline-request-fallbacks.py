from pathlib import Path
import re

ROOT = Path('/home/ubuntu/DOONO-ERP/backend/dono-api/app/Http/Requests')
pattern = re.compile(
    r"\s*\$user = \$this->user\(\);\n"
    r"\s*\$schoolId = \$this->attributes->get\('current_school_id'\)\n"
    r"\s*\?\? \(\$user \? app\(CurrentContextService::class\)->currentSchool\(\$user\)\?->id : null\);"
)
changed = []
for path in sorted(ROOT.glob('*.php')):
    original = path.read_text()
    updated, count = pattern.subn(
        "\n        $schoolId = app(CurrentContextService::class)->currentSchool($this->user())?->id;",
        original,
        count=1,
    )
    if count:
        path.write_text(updated)
        changed.append(path)

print(f'Updated {len(changed)} FormRequests')
for path in changed:
    print(path)
