<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Student;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\MediaStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;

class AssignmentAttachmentController
{
    public function __construct(private CurrentContextService $context, private MediaStorageService $media) {}

    public function assignmentUrl(Request $request, Assignment $assignment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assignment->school_id === $schoolId, 404);
        abort_unless($assignment->attachment_url, 404, 'This assignment has no attachment.');
        abort_unless($this->mayViewAssignment($request, $assignment, $schoolId), 403);
        $expiresAt = now()->addMinutes(10);
        return response()->json(['data' => ['url' => URL::temporarySignedRoute('assignments.attachment.download', $expiresAt, ['assignment' => $assignment->id]), 'expires_at' => $expiresAt->toIso8601String()]]);
    }

    public function submissionUrl(Request $request, Assignment $assignment, AssignmentSubmission $submission)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assignment->school_id === $schoolId && (int) $submission->assignment_id === (int) $assignment->id && (int) $submission->school_id === $schoolId, 404);
        abort_unless($submission->attachment_url, 404, 'This submission has no attachment.');
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();
        $isOwner = $student && (int) $submission->student_id === (int) $student->id;
        abort_unless($isOwner || $request->user()->hasPermission('manage_assignments', $schoolId), 403);
        $expiresAt = now()->addMinutes(10);
        return response()->json(['data' => ['url' => URL::temporarySignedRoute('assignments.submission.download', $expiresAt, ['assignment' => $assignment->id, 'submission' => $submission->id]), 'expires_at' => $expiresAt->toIso8601String()]]);
    }

    public function assignment(Request $request, Assignment $assignment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assignment->school_id === $schoolId, 404);
        abort_unless($assignment->attachment_url, 404, 'This assignment has no attachment.');
        abort_unless($this->mayViewAssignment($request, $assignment, $schoolId), 403);
        ActivityLogService::log('assignments', 'attachment_downloaded', 'An assignment attachment was downloaded.', $assignment, [], $schoolId);

        return $this->download($assignment->attachment_url, 'assignment-' . $assignment->id);
    }

    public function submission(Request $request, Assignment $assignment, AssignmentSubmission $submission)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $assignment->school_id === $schoolId && (int) $submission->assignment_id === (int) $assignment->id && (int) $submission->school_id === $schoolId, 404);
        abort_unless($submission->attachment_url, 404, 'This submission has no attachment.');

        $user = $request->user();
        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $user->id)->first();
        $isOwner = $student && (int) $submission->student_id === (int) $student->id;
        abort_unless($isOwner || $user->hasPermission('manage_assignments', $schoolId), 403);
        ActivityLogService::log('assignments', 'submission_attachment_downloaded', 'A submission attachment was downloaded.', $submission, [], $schoolId);

        return $this->download($submission->attachment_url, 'submission-' . $submission->id);
    }

    private function mayViewAssignment(Request $request, Assignment $assignment, int $schoolId): bool
    {
        $user = $request->user();
        if ($user->hasPermission('manage_assignments', $schoolId) || $user->hasPermission('view_assignments', $schoolId)) {
            return true;
        }

        $student = Student::query()->where('school_id', $schoolId)->where('user_id', $user->id)->first();
        if (! $student) {
            return false;
        }
        $classId = $student->class_id ?: $student->enrollments()->where('school_id', $schoolId)->where('status', 'Active')->latest('id')->value('class_id');
        $streamId = $student->stream_id ?: $student->enrollments()->where('school_id', $schoolId)->where('status', 'Active')->latest('id')->value('stream_id');

        return (int) $assignment->class_id === (int) $classId
            && ($assignment->stream_id === null || (int) $assignment->stream_id === (int) $streamId)
            && $assignment->status === 'Published';
    }

    private function download(string $path, string $name)
    {
        if (Str::startsWith($path, ['http://', 'https://'])) {
            return redirect()->away($path);
        }

        $extension = pathinfo(parse_url($path, PHP_URL_PATH) ?: $path, PATHINFO_EXTENSION) ?: 'bin';
        if ($this->media->privateExists($path)) {
            return $this->media->privateDownload($path, $name, $extension);
        }

        $disk = config('filesystems.default') === 's3' ? Storage::disk('s3') : Storage::disk('public');
        abort_unless($disk->exists($path), 404, 'The attachment is no longer available.');
        return $disk->download($path, $name . '.' . $extension);
    }
}
