<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\ClassModel;
use App\Models\Organization;
use App\Models\ParentModel;
use App\Models\ResultSubmission;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentResultSummary;
use App\Models\User;
use App\Services\CurrentContextService;
use Illuminate\Support\Collection;

class GlobalSearchService
{
    public function __construct(private CurrentContextService $context) {}

    public function search(User $user, string $term, ?string $type = null, int $limit = 10): array
    {
        $school = $this->context->currentSchool($user);
        $organization = $this->context->currentOrganization($user, $school);
        $term = trim($term);
        $limit = min(max($limit, 1), 25);
        $types = $this->allowedTypes($user, $school?->id, $type);
        $results = collect();

        if (! $school) {
            if (in_array('organizations', $types, true) && ($user->isSuperAdmin() || $organization?->owner_id === $user->id)) {
                $query = Organization::query()->where('name', 'like', '%'.$this->likeTerm($term).'%');
                if (! $user->isSuperAdmin()) {
                    $query->whereKey($organization?->id);
                }
                $results = $results->merge($query->limit($limit)->get(['id', 'name'])->map(fn ($record) => $this->result('organization', $record->id, $record->name, 'Organization', 'organizations')));
            }
            if (in_array('schools', $types, true)) {
                $query = School::query()->where(function ($builder) use ($term) {
                    $like = '%'.$this->likeTerm($term).'%';
                    $builder->where('name', 'like', $like)->orWhere('school_code', 'like', $like);
                });
                if (! $user->isSuperAdmin()) {
                    $query->where('organization_id', $organization?->id);
                }
                $results = $results->merge($query->limit($limit)->get(['id', 'name', 'school_code'])->map(fn ($record) => $this->result('school', $record->id, $record->name, $record->school_code ? 'School code: '.$record->school_code : 'School', 'schools')));
            }
        } else {
            $schoolId = (int) $school->id;
            if (in_array('students', $types, true) && $user->hasPermission('view_students', $schoolId)) {
                $like = '%'.$this->likeTerm($term).'%';
                $query = Student::query()->where('school_id', $schoolId)->where(function ($builder) use ($like) {
                    $builder->where('admission_number', 'like', $like)
                        ->orWhere('first_name', 'like', $like)
                        ->orWhere('middle_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                });
                $results = $results->merge($query->limit($limit)->get(['id', 'admission_number', 'first_name', 'middle_name', 'last_name', 'status'])->map(fn ($record) => $this->result('student', $record->id, $record->full_name, trim(($record->admission_number ?: 'No admission number').' · '.($record->status ?: 'Active')), 'students')));
            }

            if (in_array('parents', $types, true) && $user->hasPermission('manage_parents', $schoolId)) {
                $like = '%'.$this->likeTerm($term).'%';
                $query = ParentModel::query()->where('school_id', $schoolId)->where(function ($builder) use ($like) {
                    $builder->where('father_name', 'like', $like)->orWhere('mother_name', 'like', $like)->orWhere('guardian_name', 'like', $like)->orWhere('father_email', 'like', $like)->orWhere('mother_email', 'like', $like)->orWhere('guardian_email', 'like', $like)->orWhere('father_phone', 'like', $like)->orWhere('mother_phone', 'like', $like)->orWhere('guardian_phone', 'like', $like);
                });
                $results = $results->merge($query->limit($limit)->get(['id', 'father_name', 'mother_name', 'guardian_name', 'father_email', 'mother_email', 'guardian_email'])->map(fn ($record) => $this->result('parent', $record->id, $record->display_name, 'Parent or guardian profile', 'parents')));
            }

            if (in_array('staff', $types, true) && $user->hasPermission('view_staff', $schoolId)) {
                $like = '%'.$this->likeTerm($term).'%';
                $query = Staff::query()->where('school_id', $schoolId)->where(function ($builder) use ($like) {
                    $builder->where('staff_number', 'like', $like)->orWhere('first_name', 'like', $like)->orWhere('middle_name', 'like', $like)->orWhere('last_name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('phone', 'like', $like);
                });
                $results = $results->merge($query->limit($limit)->get(['id', 'staff_number', 'first_name', 'middle_name', 'last_name', 'designation', 'employment_status'])->map(fn ($record) => $this->result('staff', $record->id, $record->full_name, trim(($record->designation ?: 'Staff').' · '.($record->employment_status ?: 'active')), 'staff')));
            }

            if (in_array('enrollments', $types, true) && $user->hasPermission('view_students', $schoolId)) {
                $like = '%'.$this->likeTerm($term).'%';
                $query = StudentEnrollment::query()->where('school_id', $schoolId)->whereHas('student', function ($builder) use ($like) {
                    $builder->where('admission_number', 'like', $like)->orWhere('first_name', 'like', $like)->orWhere('middle_name', 'like', $like)->orWhere('last_name', 'like', $like);
                })->with(['student:id,admission_number,first_name,middle_name,last_name', 'academicSession:id,name', 'term:id,name', 'class:id,name', 'stream:id,name']);
                $results = $results->merge($query->latest('id')->limit($limit)->get()->map(fn ($record) => $this->result('enrollment', $record->id, $record->student?->full_name ?: 'Student enrollment', trim(($record->academicSession?->name ?: 'Session').' · '.($record->term?->name ?: 'Term').' · '.($record->class?->name ?: 'Class')), 'student-enrollments')));
            }

            if (in_array('results', $types, true) && $user->hasPermission('view_results', $schoolId)) {
                $like = '%'.$this->likeTerm($term).'%';
                $query = StudentResultSummary::query()->where('school_id', $schoolId)->whereHas('studentEnrollment.student', function ($builder) use ($like) {
                    $builder->where('admission_number', 'like', $like)->orWhere('first_name', 'like', $like)->orWhere('middle_name', 'like', $like)->orWhere('last_name', 'like', $like);
                })->with(['studentEnrollment.student:id,admission_number,first_name,middle_name,last_name', 'academicSession:id,name', 'term:id,name']);
                $results = $results->merge($query->latest('id')->limit($limit)->get()->map(fn ($record) => $this->result('result', $record->id, $record->studentEnrollment?->student?->full_name ?: 'Student result', trim(($record->academicSession?->name ?: 'Session').' · '.($record->term?->name ?: 'Term').' · '.($record->is_published ? 'Published' : 'Prepared')), 'report-cards')));
            }
        }

        return [
            'query' => $term,
            'results' => $results->take($limit * max(count($types), 1))->values()->all(),
            'context' => ['organization_id' => $organization?->id, 'school_id' => $school?->id],
            'searched_at' => now()->toIso8601String(),
        ];
    }

    private function allowedTypes(User $user, ?int $schoolId, ?string $requested): array
    {
        $available = $schoolId ? ['students', 'parents', 'staff', 'enrollments', 'results'] : ['organizations', 'schools'];
        if ($requested && in_array($requested, $available, true)) {
            return [$requested];
        }
        return $available;
    }

    private function result(string $type, int $id, string $title, string $subtitle, string $page): array
    {
        return ['type' => $type, 'id' => $id, 'title' => $title ?: ucfirst($type), 'subtitle' => $subtitle, 'page' => $page];
    }

    private function likeTerm(string $term): string
    {
        return addcslashes($term, '%_');
    }
}
