from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

backend = ROOT / 'backend' / 'dono-api'
frontend = ROOT / 'frontend' / 'src'

for folder in [backend / 'app' / 'Http' / 'Controllers', backend / 'app' / 'Http' / 'Requests', backend / 'routes']:
    for path in folder.rglob('*.php'):
        text = path.read_text(errors='ignore')
        if 'currentSchoolId' in text:
            errors.append(f'Forbidden duplicated school resolver in {path.relative_to(ROOT)}')

for path in frontend.rglob('*'):
    if path.suffix not in {'.js', '.jsx', '.ts', '.tsx'}:
        continue
    text = path.read_text(errors='ignore')
    if re.search(r'user\?\.role\s*\|\||user\.roles\?\.\[0\]\?\.slug', text):
        errors.append(f'Legacy frontend role detection in {path.relative_to(ROOT)}')

for path in (backend / 'app' / 'Models').glob('*.php'):
    text = path.read_text(errors='ignore')
    match = re.search(r'protected\s+\$fillable\s*=\s*\[(.*?)\];', text, re.S)
    if not match:
        errors.append(f'Model has no explicit fillable array: {path.relative_to(ROOT)}')
    elif not match.group(1).strip():
        errors.append(f'Model has an empty fillable array: {path.relative_to(ROOT)}')

support = backend / 'app' / 'Http' / 'Controllers' / 'Api' / 'SupportTicketController.php'
if support.exists():
    text = support.read_text(errors='ignore')
    if "where('is_internal_note', false)" not in text or '$viewer?->isSuperAdmin()' not in text:
        errors.append('Support ticket internal-note visibility guard is missing')

api = frontend / 'services' / 'api.js'
if not api.exists():
    errors.append('Canonical frontend API client is missing')
else:
    text = api.read_text(errors='ignore')
    if 'baseURL: API_URL' not in text:
        errors.append('Canonical frontend API client does not set baseURL')

if errors:
    print('DOONO architecture guard FAILED')
    for error in errors:
        print(f'- {error}')
    sys.exit(1)

print('DOONO architecture guard PASSED')
print('Checked: CurrentContextService boundary, shared role helper usage, model fillable arrays, Support Centre privacy, and canonical Axios client.')
