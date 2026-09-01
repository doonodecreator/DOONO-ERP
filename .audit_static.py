from pathlib import Path
import re

root = Path('/home/ubuntu/DOONO-ERP')
sidebar = (root / 'frontend/src/components/Sidebar.jsx').read_text()
app = (root / 'frontend/src/App.jsx').read_text()

sidebar_targets = set(re.findall(r'page:\s*["\']([^"\']+)', sidebar))
app_cases = set(re.findall(r'case\s+["\']([^"\']+)', app))
aliases = dict(re.findall(r'\s*([A-Za-z0-9_-]+):\s*["\']([^"\']+)', app[app.find('const PAGE_ALIASES'):app.find('const ROLE_DASHBOARDS')]))
resolved = {aliases.get(target, target) for target in sidebar_targets}
print('UNRESOLVED_SIDEBAR_TARGETS')
for target in sorted(target for target in resolved if target not in app_cases):
    print(target)
print('ROLE_DETECTION_VIOLATIONS')
for path in root.glob('frontend/src/**/*'):
    if path.suffix not in {'.js', '.jsx', '.ts', '.tsx'}:
        continue
    text = path.read_text(errors='ignore')
    if 'user?.role || user?.roles?.[0]?.slug' in text:
        print(path)
print('DOUBLE_V1_PATHS')
for path in root.glob('frontend/src/**/*'):
    if path.suffix not in {'.js', '.jsx', '.ts', '.tsx'}:
        continue
    for line_no, line in enumerate(path.read_text(errors='ignore').splitlines(), 1):
        if '/v1/' in line or '"v1/' in line or "'v1/" in line:
            print(f'{path}:{line_no}:{line.strip()}')
print('SIDEBAR_TARGET_COUNT', len(sidebar_targets))
print('APP_CASE_COUNT', len(app_cases))
