<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\GraduationRecord;
use App\Models\Student;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;

class GraduationRecordController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        return response()->json(['data' => GraduationRecord::query()->where('school_id', $schoolId)->with(['student', 'academicSession'])->latest()->paginate(20)]);
    }

    public function store(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $data = $request->validate([
            'student_id' => ['required', 'integer'],
            'academic_session_id' => ['nullable', 'integer'],
            'graduation_date' => ['nullable', 'date'],
            'certificate_number' => ['nullable', 'string', 'max:100'],
            'destination' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'in:graduated,alumni,pending'],
            'notes' => ['nullable', 'string'],
        ]);
        abort_unless(Student::whereKey($data['student_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected student does not belong to the current school.');
        if (! empty($data['academic_session_id'])) abort_unless(AcademicSession::whereKey($data['academic_session_id'])->where('school_id', $schoolId)->exists(), 422, 'The selected academic session does not belong to the current school.');
        $record = GraduationRecord::create([...$data, 'school_id' => $schoolId, 'created_by' => $request->user()->id]);
        ActivityLogService::log('Graduation', 'CREATE', 'Created a graduation or alumni record.', $record, [], $schoolId);
        return response()->json(['data' => $record->load(['student', 'academicSession'])], 201);
    }

    public function update(Request $request, GraduationRecord $graduationRecord)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $graduationRecord->school_id === $schoolId, 404, 'Graduation record not found.');
        $data = $request->validate(['graduation_date' => ['sometimes', 'nullable', 'date'], 'certificate_number' => ['sometimes', 'nullable', 'string', 'max:100'], 'destination' => ['sometimes', 'nullable', 'string', 'max:255'], 'status' => ['sometimes', 'in:graduated,alumni,pending'], 'notes' => ['sometimes', 'nullable', 'string']]);
        $graduationRecord->update($data);
        ActivityLogService::log('Graduation', 'UPDATE', 'Updated a graduation or alumni record.', $graduationRecord, [], $schoolId);
        return response()->json(['data' => $graduationRecord->fresh()->load(['student', 'academicSession'])]);
    }

    public function destroy(Request $request, GraduationRecord $graduationRecord)
    {
        $schoolId = $this->requireSchool($request);
        abort_unless((int) $graduationRecord->school_id === $schoolId, 404, 'Graduation record not found.');
        $graduationRecord->delete();
        ActivityLogService::log('Graduation', 'DELETE', 'Deleted a graduation or alumni record.', $graduationRecord, [], $schoolId);
        return response()->json(['message' => 'Graduation record deleted successfully.']);
    }
}
