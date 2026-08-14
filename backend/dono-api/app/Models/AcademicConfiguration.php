<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicConfiguration extends Model
{
    /**
     * School identity is assigned by trusted application code, not request payloads.
     */
    protected $fillable = [
        'pass_mark',
        'maximum_score',
        'ranking_method',
        'tie_breaker',
        'promotion_pass_mark',
        'promote_final_term_only',
        'automatic_promotion',
        'require_principal_approval',
        'lock_results_after_approval',
        'show_class_position',
        'show_attendance',
        'show_behaviour_assessment',
        'show_skill_assessment',
        'show_principal_signature',
        'show_school_stamp',
        'enable_qr_verification',
        'require_class_teacher_review',
        'require_vice_principal_approval',
        'auto_publish_after_approval',
        'lock_after_publishing',
        'show_student_passport',
        'show_class_average',
        'show_highest_score',
        'show_lowest_score',
        'show_behaviour',
        'show_skills',
        'show_teacher_comment',
        'show_principal_comment',
        'show_qr_verification',
    ];

    protected $casts = [
        'pass_mark' => 'integer',
        'maximum_score' => 'integer',
        'promotion_pass_mark' => 'integer',
        'promote_final_term_only' => 'boolean',
        'automatic_promotion' => 'boolean',
        'require_principal_approval' => 'boolean',
        'lock_results_after_approval' => 'boolean',
        'show_class_position' => 'boolean',
        'show_attendance' => 'boolean',
        'show_behaviour_assessment' => 'boolean',
        'show_skill_assessment' => 'boolean',
        'show_principal_signature' => 'boolean',
        'show_school_stamp' => 'boolean',
        'enable_qr_verification' => 'boolean',
        'require_class_teacher_review' => 'boolean',
        'require_vice_principal_approval' => 'boolean',
        'auto_publish_after_approval' => 'boolean',
        'lock_after_publishing' => 'boolean',
        'show_student_passport' => 'boolean',
        'show_class_average' => 'boolean',
        'show_highest_score' => 'boolean',
        'show_lowest_score' => 'boolean',
        'show_behaviour' => 'boolean',
        'show_skills' => 'boolean',
        'show_teacher_comment' => 'boolean',
        'show_principal_comment' => 'boolean',
        'show_qr_verification' => 'boolean',
    ];
}
