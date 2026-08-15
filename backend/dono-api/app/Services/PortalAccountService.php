<?php

namespace App\Services;

use App\Models\Guardian;
use App\Models\ParentModel;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PortalAccountService
{
    public function linkStudent(Student $student, array $data, int $schoolId): Student
    {
        return DB::transaction(function () use ($student, $data, $schoolId) {
            if ($student->school_id !== $schoolId) {
                abort(403);
            }

            if ($student->user_id) {
                throw ValidationException::withMessages([
                    'student' => ['This student already has a portal account.'],
                ]);
            }

            $user = $this->createUserWithRole(
                name: $student->full_name,
                email: $data['email'],
                password: $data['password'],
                roleSlug: 'student',
                schoolId: $schoolId,
            );

            $student->update(['user_id' => $user->id]);

            return $student->fresh(['user']);
        });
    }

    public function linkParent(
        ParentModel $parent,
        array $data,
        int $schoolId
    ): Guardian {
        return DB::transaction(function () use ($parent, $data, $schoolId) {
            if ($parent->school_id !== $schoolId) {
                abort(403);
            }

            $existingGuardian = Guardian::where('school_id', $schoolId)
                ->where('parent_id', $parent->id)
                ->first();

            if ($existingGuardian?->user_id) {
                throw ValidationException::withMessages([
                    'parent' => ['This parent already has a portal account.'],
                ]);
            }

            $user = $this->createUserWithRole(
                name: trim("{$data['first_name']} {$data['last_name']}"),
                email: $data['email'],
                password: $data['password'],
                roleSlug: 'parent',
                schoolId: $schoolId,
            );

            $guardian = $existingGuardian ?? new Guardian();
            $guardian->fill([
                'school_id' => $schoolId,
                'user_id' => $user->id,
                'parent_id' => $parent->id,
                'title' => null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $parent->father_phone
                    ?? $parent->mother_phone
                    ?? $parent->guardian_phone,
                'address' => $parent->address,
                'occupation' => null,
            ]);
            $guardian->save();

            $studentIds = $parent->students()
                ->where('students.school_id', $schoolId)
                ->pluck('students.id');

            if ($studentIds->isNotEmpty()) {
                $guardian->students()->syncWithoutDetaching(
                    $studentIds->mapWithKeys(fn ($studentId) => [
                        $studentId => [
                            'relationship' => $data['relationship'] ?? 'Parent',
                        ],
                    ])->all()
                );
            }

            return $guardian->fresh(['user', 'students.class', 'students.division']);
        });
    }

    private function createUserWithRole(
        string $name,
        string $email,
        string $password,
        string $roleSlug,
        int $schoolId
    ): User {
        $role = Role::where('slug', $roleSlug)->first();

        if (! $role) {
            throw ValidationException::withMessages([
                'role' => ["The {$roleSlug} role is not configured."],
            ]);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $user->roles()->attach($role->id, [
            'school_id' => $schoolId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $user;
    }
}
