<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Services\CurrentContextService;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function __construct(protected CurrentContextService $context) {}

    public function index(Request $request)
    {
        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;

        return response()->json(
            Expense::when($schoolId, function ($query) use ($schoolId) {
                $query->where('school_id', $schoolId);
            })
            ->with(['recorder'])
            ->latest()
            ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'category' => 'required|string',
            'expense_date' => 'required|date',
        ]);

        $schoolId = $request->attributes->get('current_school_id') ?? $this->context->currentSchool($request->user())?->id;
        if ($schoolId) {
            $validated['school_id'] = $schoolId;
        }
        
        $validated['recorded_by'] = $request->user()->id;

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'Expense recorded successfully.',
            'data' => $expense->load(['recorder'])
        ], 201);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully.'
        ]);
    }
}
