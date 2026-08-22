from pathlib import Path
import re

ROOT = Path('/home/ubuntu/DOONO-ERP/backend/dono-api/app/Http/Controllers/Api')

request_helper_files = [
    'AssetController.php',
    'DisciplineCaseController.php',
    'HostelAllocationController.php',
    'LeaveRequestController.php',
    'ParentStudentController.php',
    'PrincipalController.php',
    'RoleInvitationController.php',
    'SafetyIncidentController.php',
    'SchoolEventController.php',
    'SchoolFacilityController.php',
    'StaffAttendanceController.php',
    'StaffController.php',
    'TransportAllocationController.php',
    'TransportRouteController.php',
    'VicePrincipalAdminController.php',
    'AssignmentController.php',
]

for filename in request_helper_files:
    path = ROOT / filename
    text = path.read_text()
    original = text
    text, removed = re.subn(
        r'\n    private function currentSchoolId\(Request \$request\): \??int\n    \{.*?\n    \}\n',
        '\n',
        text,
        count=1,
        flags=re.S,
    )
    if removed != 1:
        raise SystemExit(f'Expected one Request currentSchoolId helper in {path}, found {removed}')
    text = text.replace('$this->currentSchoolId($request)', '$this->requireSchool($request)')
    if text == original:
        raise SystemExit(f'No effective change made to {path}')
    path.write_text(text)

for filename in ['AcademicSessionController.php', 'TermController.php']:
    path = ROOT / filename
    text = path.read_text()
    original = text
    text, removed = re.subn(
        r'\n    private function currentSchoolId\(User \$user\): \??int\n    \{.*?\n    \}\n',
        '\n',
        text,
        count=1,
        flags=re.S,
    )
    if removed != 1:
        raise SystemExit(f'Expected one User currentSchoolId helper in {path}, found {removed}')
    text = text.replace('$this->currentSchoolId($user)', '$this->context->currentSchool($user)?->id')
    if text == original:
        raise SystemExit(f'No effective change made to {path}')
    path.write_text(text)

print(f'Standardized {len(request_helper_files) + 2} controllers.')
