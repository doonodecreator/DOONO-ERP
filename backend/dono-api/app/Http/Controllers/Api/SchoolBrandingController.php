<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SchoolResource;
use App\Models\AcademicConfiguration;
use App\Models\School;
use App\Services\ActivityLogService;
use App\Services\CurrentContextService;
use App\Services\MediaStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolBrandingController extends Controller
{
    public function __construct(
        private readonly CurrentContextService $context,
        private readonly MediaStorageService $media,
    ) {}

    public function show(Request $request)
    {
        [$school, $configuration] = $this->currentSchoolAndConfiguration($request);

        return response()->json([
            'success' => true,
            'data' => [
                'school' => new SchoolResource($school),
                'academic_configuration' => $configuration,
            ],
        ]);
    }

    public function update(Request $request)
    {
        [$school, $configuration] = $this->currentSchoolAndConfiguration($request);

        $validated = $request->validate([
            'logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:5120'],
            'report_card_logo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:5120'],
            'principal_signature' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:5120'],
            'school_stamp' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp,svg', 'max:5120'],
            'primary_color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['sometimes', 'required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'report_card_theme' => ['sometimes', 'required', 'string', 'in:classic,modern,minimal'],
            'report_card_layout' => ['sometimes', 'required', 'string', 'in:standard,compact,landscape'],
            'custom_header' => ['nullable', 'string', 'max:5000'],
            'custom_footer' => ['nullable', 'string', 'max:5000'],
            'show_watermark' => ['sometimes', 'boolean'],
            'allow_branding' => ['sometimes', 'boolean'],
            'watermark_text' => ['nullable', 'string', 'max:255'],
            'pass_mark' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'maximum_score' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'promotion_pass_mark' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'show_class_position' => ['sometimes', 'boolean'],
            'show_class_average' => ['sometimes', 'boolean'],
            'show_attendance' => ['sometimes', 'boolean'],
            'show_student_passport' => ['sometimes', 'boolean'],
            'show_principal_signature' => ['sometimes', 'boolean'],
            'show_school_stamp' => ['sometimes', 'boolean'],
            'show_teacher_comment' => ['sometimes', 'boolean'],
            'show_principal_comment' => ['sometimes', 'boolean'],
            'show_behaviour' => ['sometimes', 'boolean'],
            'show_skills' => ['sometimes', 'boolean'],
            'show_qr_verification' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($request, $validated, $school, $configuration): void {
            $branding = collect($validated)->only([
                'primary_color',
                'secondary_color',
                'accent_color',
                'report_card_theme',
                'report_card_layout',
                'custom_header',
                'custom_footer',
                'show_watermark',
                'allow_branding',
                'watermark_text',
            ])->all();

            foreach (['logo', 'report_card_logo', 'principal_signature', 'school_stamp'] as $field) {
                if ($request->hasFile($field)) {
                    $branding[$field] = $this->media->storeImage(
                        $request->file($field),
                        'schools/' . $school->id . '/branding',
                        $school->{$field},
                    );
                }
            }

            if ($branding !== []) {
                $school->update($branding);
            }

            $academicFields = collect($validated)->only([
                'pass_mark',
                'maximum_score',
                'promotion_pass_mark',
                'show_class_position',
                'show_class_average',
                'show_attendance',
                'show_student_passport',
                'show_principal_signature',
                'show_school_stamp',
                'show_teacher_comment',
                'show_principal_comment',
                'show_behaviour',
                'show_skills',
                'show_qr_verification',
            ])->all();

            if ($academicFields !== []) {
                $configuration->fill($academicFields);
                $configuration->save();
            }
        });

        ActivityLogService::log(
            module: 'school_branding',
            action: 'updated',
            description: "Branding and report-card design updated for school {$school->name}.",
            subject: $school,
            properties: collect($validated)->except(['logo', 'report_card_logo', 'principal_signature', 'school_stamp'])->all(),
            schoolId: $school->id,
        );

        [$school, $configuration] = $this->currentSchoolAndConfiguration($request);

        return response()->json([
            'success' => true,
            'message' => 'School branding and report-card design saved successfully.',
            'data' => [
                'school' => new SchoolResource($school),
                'academic_configuration' => $configuration,
            ],
        ]);
    }

    private function currentSchoolAndConfiguration(Request $request): array
    {
        $user = $request->user();
        $school = $this->context->currentSchool($user);

        abort_unless($school, 409, 'Select an active school before editing school branding.');
        abort_unless(
            $user->isSuperAdmin()
                || (int) $school->owner_id === (int) $user->id
                || $user->hasRole('proprietor', (int) $school->id),
            403,
            'Only the school proprietor may manage branding and report-card design.'
        );

        $configuration = AcademicConfiguration::query()->where('school_id', $school->id)->first();
        if (! $configuration) {
            $configuration = new AcademicConfiguration();
            $configuration->school_id = $school->id;
            $configuration->pass_mark = 40;
            $configuration->maximum_score = 100;
            $configuration->promotion_pass_mark = 50;
            $configuration->show_class_position = true;
            $configuration->show_class_average = true;
            $configuration->show_attendance = true;
            $configuration->show_student_passport = true;
            $configuration->show_principal_signature = true;
            $configuration->show_school_stamp = true;
            $configuration->show_teacher_comment = true;
            $configuration->show_principal_comment = true;
            $configuration->show_behaviour = true;
            $configuration->show_skills = true;
            $configuration->show_qr_verification = false;
            $configuration->save();
        }

        return [$school->fresh(), $configuration->fresh()];
    }
}
