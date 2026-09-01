<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityComment;
use App\Models\CommunityPost;
use App\Models\CommunityReport;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\StudentCommunityConsent;
use App\Models\StudentEnrollment;
use App\Services\ActivityLogService;
use App\Services\MediaStorageService;
use App\Services\VideoUploadSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

class CommunityController extends Controller
{
    public function __construct(private MediaStorageService $media, private VideoUploadSecurityService $videoSecurity) {}

    public function feed(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->currentStudent($request, $schoolId);
        abort_unless($student, 403, 'Only an authenticated student account can open the student community.');
        $this->requireActiveEnrollment($student, $schoolId);

        return response()->json([
            'data' => CommunityPost::query()
                ->where('school_id', $schoolId)
                ->where('status', 'approved')
                ->with(['author:id,first_name,last_name', 'comments' => fn ($query) => $query->where('status', 'approved')->with('author:id,first_name,last_name')])
                ->latest('published_at')
                ->paginate(min(max($request->integer('per_page', 15), 1), 50)),
        ]);
    }

    public function storePost(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->currentStudent($request, $schoolId);
        abort_unless($student, 403, 'Only an authenticated student account can publish to the student community.');
        $this->requireActiveEnrollment($student, $schoolId);

        $validated = $request->validate([
            'body' => ['required', 'string', 'min:2', 'max:5000'],
            'video' => ['nullable', 'file'],
        ]);
        $videoPath = null;
        $video = $request->file('video');

        if ($video) {
            $consent = StudentCommunityConsent::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'approved')->where('video_allowed', true)->first();
            abort_unless($consent, 403, 'Guardian consent for student video publishing has not been approved.');
            $this->videoSecurity->validate($video);
            $videoPath = $this->media->storePrivate($video, 'community/' . $schoolId . '/videos');
        }

        try {
            $post = CommunityPost::create([
                'school_id' => $schoolId,
                'author_student_id' => $student->id,
                'body' => $validated['body'],
                'scope' => 'school',
                'status' => 'pending',
                'media_path' => $videoPath,
                'media_mime' => $video?->getMimeType(),
                'media_size' => $video?->getSize(),
            ]);
        } catch (\Throwable $exception) {
            $this->media->delete($videoPath);
            throw $exception;
        }

        ActivityLogService::log('community', 'post_submitted', 'A student submitted a community post for moderation.', $post, ['has_video' => (bool) $videoPath], $schoolId);
        return response()->json(['message' => 'Post submitted for school moderation.', 'data' => $post->load('author:id,first_name,last_name')], 201);
    }

    public function storeComment(Request $request, CommunityPost $communityPost)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communityPost->school_id === $schoolId && $communityPost->status === 'approved', 404, 'Community post not found.');
        $student = $this->currentStudent($request, $schoolId);
        abort_unless($student, 403, 'Only an authenticated student account can comment.');
        $this->requireActiveEnrollment($student, $schoolId);
        $validated = $request->validate(['body' => ['required', 'string', 'min:1', 'max:2000']]);

        $comment = CommunityComment::create([
            'school_id' => $schoolId,
            'community_post_id' => $communityPost->id,
            'author_student_id' => $student->id,
            'body' => $validated['body'],
            'status' => 'pending',
        ]);
        ActivityLogService::log('community', 'comment_submitted', 'A student submitted a community comment for moderation.', $comment, ['post_id' => $communityPost->id], $schoolId);
        return response()->json(['message' => 'Comment submitted for moderation.', 'data' => $comment->load('author:id,first_name,last_name')], 201);
    }

    public function report(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $student = $this->currentStudent($request, $schoolId);
        abort_unless($student, 403, 'Only an authenticated student account can report community content.');
        $this->requireActiveEnrollment($student, $schoolId);
        $validated = $request->validate([
            'target_type' => ['required', 'in:post,comment'],
            'target_id' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'in:bullying,harassment,unsafe_content,sexual_content,privacy,spam,other'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);
        $exists = $validated['target_type'] === 'post'
            ? CommunityPost::query()->whereKey($validated['target_id'])->where('school_id', $schoolId)->exists()
            : CommunityComment::query()->whereKey($validated['target_id'])->where('school_id', $schoolId)->exists();
        abort_unless($exists, 404, 'The reported community item was not found.');

        $report = CommunityReport::create([...$validated, 'school_id' => $schoolId, 'reporter_student_id' => $student->id, 'status' => 'pending']);
        ActivityLogService::log('community', 'content_reported', 'A student reported community content for review.', $report, ['target_type' => $report->target_type, 'target_id' => $report->target_id], $schoolId);
        return response()->json(['message' => 'Report submitted to the school moderation queue.', 'data' => $report], 201);
    }

    public function moderationIndex(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json([
            'posts' => CommunityPost::query()->where('school_id', $schoolId)->whereIn('status', ['pending', 'approved', 'rejected', 'taken_down'])->with('author:id,first_name,last_name')->latest()->paginate(30, ['*'], 'posts_page'),
            'comments' => CommunityComment::query()->where('school_id', $schoolId)->whereIn('status', ['pending', 'approved', 'rejected', 'taken_down'])->with(['author:id,first_name,last_name', 'post:id,body'])->latest()->paginate(30, ['*'], 'comments_page'),
            'reports' => CommunityReport::query()->where('school_id', $schoolId)->where('status', 'pending')->with('reporter:id,first_name,last_name')->latest()->paginate(30, ['*'], 'reports_page'),
        ]);
    }

    public function moderatePost(Request $request, CommunityPost $communityPost)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communityPost->school_id === $schoolId, 404, 'Community post not found.');
        $validated = $request->validate(['status' => ['required', 'in:approved,rejected,taken_down'], 'moderation_notes' => ['nullable', 'string', 'max:2000']]);
        $communityPost->update([
            'status' => $validated['status'],
            'moderation_notes' => $validated['moderation_notes'] ?? null,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'published_at' => $validated['status'] === 'approved' ? now() : null,
        ]);
        ActivityLogService::log('community', 'post_moderated', 'A school moderator changed a community post status.', $communityPost, ['status' => $validated['status']], $schoolId);
        return response()->json(['message' => 'Community post moderation saved.', 'data' => $communityPost->fresh('author')]);
    }

    public function moderateComment(Request $request, CommunityComment $communityComment)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communityComment->school_id === $schoolId, 404, 'Community comment not found.');
        $validated = $request->validate(['status' => ['required', 'in:approved,rejected,taken_down']]);
        $communityComment->update(['status' => $validated['status'], 'moderated_by' => $request->user()->id, 'moderated_at' => now()]);
        ActivityLogService::log('community', 'comment_moderated', 'A school moderator changed a community comment status.', $communityComment, ['status' => $validated['status']], $schoolId);
        return response()->json(['message' => 'Community comment moderation saved.', 'data' => $communityComment->fresh('author')]);
    }

    public function parentConsents(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $guardian = Guardian::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->with('students')->first();
        if (! $guardian) {
            return response()->json(['data' => []]);
        }

        $students = $guardian->students->filter(fn (Student $student) => (int) $student->school_id === $schoolId && StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists());
        $consents = $students->map(function (Student $student) use ($schoolId, $guardian) {
            $consent = StudentCommunityConsent::query()->firstOrCreate(
                ['school_id' => $schoolId, 'student_id' => $student->id],
                ['parent_id' => $guardian->parent_id, 'status' => 'pending']
            );
            if (! $consent->parent_id && $guardian->parent_id) {
                $consent->update(['parent_id' => $guardian->parent_id]);
            }
            return $consent->fresh()->load('student:id,first_name,last_name');
        })->values();

        return response()->json(['data' => $consents]);
    }

    public function decideParentConsent(Request $request, StudentCommunityConsent $studentCommunityConsent)
    {
        $schoolId = $this->requireSchool($request);
        $guardian = Guardian::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->whereHas('students', fn ($query) => $query->whereKey($studentCommunityConsent->student_id)->where('school_id', $schoolId))->first();
        abort_unless($guardian && (int) $studentCommunityConsent->school_id === $schoolId, 404, 'Consent record not found for this parent account.');
        $validated = $request->validate([
            'status' => ['required', 'in:approved,denied'],
            'video_allowed' => ['boolean'],
            'global_exchange_allowed' => ['boolean'],
        ]);
        $approved = $validated['status'] === 'approved';
        $studentCommunityConsent->update([
            'parent_id' => $guardian->parent_id,
            'status' => $validated['status'],
            'video_allowed' => $approved && (bool) ($validated['video_allowed'] ?? false),
            'global_exchange_allowed' => $approved && (bool) ($validated['global_exchange_allowed'] ?? false),
            'decided_by' => $request->user()->id,
            'decided_at' => now(),
        ]);
        ActivityLogService::log('community', 'guardian_consent_updated', 'A linked guardian updated student community consent.', $studentCommunityConsent, ['student_id' => $studentCommunityConsent->student_id, 'status' => $validated['status']], $schoolId);
        return response()->json(['message' => 'Guardian consent saved.', 'data' => $studentCommunityConsent->fresh()->load('student:id,first_name,last_name')]);
    }

    public function consentIndex(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => StudentCommunityConsent::query()->where('school_id', $schoolId)->with(['student:id,first_name,last_name', 'parent:id,display_name'])->latest('updated_at')->paginate(50)]);
    }

    public function videoUrl(Request $request, CommunityPost $communityPost)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communityPost->school_id === $schoolId && $communityPost->status === 'approved' && $communityPost->media_path, 404, 'Approved community video not found.');
        $student = $this->currentStudent($request, $schoolId);
        if ($student) {
            $this->requireActiveEnrollment($student, $schoolId);
        }
        abort_unless($student || $request->user()->hasPermission('manage_community', $schoolId), 403, 'You cannot view this community video.');
        $expiresAt = now()->addMinutes(10);
        $routeName = $request->user()->hasPermission('manage_community', $schoolId) && ! $student
            ? 'community.moderation.video.download'
            : 'community.video.download';
        return response()->json(['data' => ['url' => URL::temporarySignedRoute($routeName, $expiresAt, ['communityPost' => $communityPost->id]), 'expires_at' => $expiresAt->toIso8601String()]]);
    }

    public function video(Request $request, CommunityPost $communityPost)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $communityPost->school_id === $schoolId && $communityPost->status === 'approved' && $communityPost->media_path, 404, 'Approved community video not found.');
        $student = $this->currentStudent($request, $schoolId);
        if ($student) {
            $this->requireActiveEnrollment($student, $schoolId);
        }
        abort_unless($student || $request->user()->hasPermission('manage_community', $schoolId), 403, 'You cannot view this community video.');
        return $this->media->privateDownload($communityPost->media_path, 'community-video-' . $communityPost->id, pathinfo($communityPost->media_path, PATHINFO_EXTENSION));
    }

    private function currentStudent(Request $request, int $schoolId): ?Student
    {
        return Student::query()->where('school_id', $schoolId)->where('user_id', $request->user()->id)->first();
    }

    private function requireActiveEnrollment(Student $student, int $schoolId): void
    {
        abort_unless(StudentEnrollment::query()->where('school_id', $schoolId)->where('student_id', $student->id)->where('status', 'Active')->exists(), 403, 'This feature is available only for actively enrolled students.');
    }
}
