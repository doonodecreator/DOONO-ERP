from pathlib import Path

ROOT = Path('/home/ubuntu/DOONO-ERP/backend/dono-api/app/Http/Controllers')
paths = sorted({p for p in ROOT.rglob('*.php') if 'currentContextSchoolId' in p.read_text(errors='ignore')})
changed = []

for path in paths:
    text = path.read_text()
    marker = '    private function currentContextSchoolId'
    start = text.find(marker)
    if start < 0:
        raise RuntimeError(f'Helper marker missing in {path}')
    brace = text.find('{', start)
    if brace < 0:
        raise RuntimeError(f'Helper opening brace missing in {path}')
    depth = 0
    end = None
    for index in range(brace, len(text)):
        char = text[index]
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                end = index + 1
                break
    if end is None:
        raise RuntimeError(f'Helper closing brace missing in {path}')
    updated = text[:start] + text[end:]
    updated = updated.replace('$this->currentContextSchoolId($request)', '$this->context->currentSchool($request->user())?->id')
    if 'currentContextSchoolId' in updated:
        raise RuntimeError(f'Residual helper reference in {path}')
    path.write_text(updated)
    changed.append(path)

print(f'Updated {len(changed)} controllers')
for path in changed:
    print(path)
