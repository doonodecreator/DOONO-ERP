from pathlib import Path
import re

ROOT = Path('/home/ubuntu/DOONO-ERP/backend/dono-api/app/Http/Requests')
files = sorted(ROOT.glob('*.php'))
pattern = re.compile(r'\n    private function currentSchoolId\(\): \?int\n    \{.*?\n    \}\n', re.S)
changed = []

for path in files:
    original = path.read_text()
    if 'currentSchoolId' not in original:
        continue
    updated, removed = pattern.subn('\n', original, count=1)
    if removed != 1:
        raise RuntimeError(f'Could not safely remove exactly one resolver from {path}')
    updated = updated.replace('$this->currentSchoolId()', 'app(CurrentContextService::class)->currentSchool($this->user())?->id')
    if 'currentSchoolId' in updated:
        raise RuntimeError(f'Residual currentSchoolId found in {path}')
    if updated == original:
        raise RuntimeError(f'No effective change made to {path}')
    path.write_text(updated)
    changed.append(str(path))

print(f'Updated {len(changed)} FormRequests')
for path in changed:
    print(path)
