<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FeePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class FinancialReportController extends Controller
{
    public function index(Request $request)
    {
        $schoolId = $this->requireSchool($request);
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from']) ? Carbon::parse($validated['from'])->startOfDay() : null;
        $to = isset($validated['to']) ? Carbon::parse($validated['to'])->endOfDay() : null;

        $paymentsQuery = FeePayment::query()
            ->whereHas('studentFee.studentEnrollment.student', fn ($query) => $query->where('school_id', $schoolId))
            ->with(['studentFee.studentEnrollment.student'])
            ->when($from, fn ($query) => $query->whereDate('payment_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('payment_date', '<=', $to));

        $expensesQuery = Expense::query()
            ->where('school_id', $schoolId)
            ->when($from, fn ($query) => $query->whereDate('expense_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('expense_date', '<=', $to));

        $payments = $paymentsQuery->latest('payment_date')->get();
        $expenses = $expensesQuery->latest('expense_date')->get();
        $incomeTotal = (float) $payments->sum(fn ($payment) => (float) $payment->amount_paid);
        $expenseTotal = (float) $expenses->sum(fn ($expense) => (float) $expense->amount);

        return response()->json([
            'data' => [
                'filters' => [
                    'from' => $from?->toDateString(),
                    'to' => $to?->toDateString(),
                ],
                'summary' => [
                    'income' => $incomeTotal,
                    'expenses' => $expenseTotal,
                    'profit_loss' => $incomeTotal - $expenseTotal,
                    'payment_count' => $payments->count(),
                    'expense_count' => $expenses->count(),
                ],
                'income_by_method' => $payments->groupBy(fn ($payment) => $payment->payment_method ?: 'Unspecified')
                    ->map(fn ($items, $method) => [
                        'method' => $method,
                        'amount' => (float) $items->sum(fn ($payment) => (float) $payment->amount_paid),
                        'count' => $items->count(),
                    ])->values(),
                'expenses_by_category' => $expenses->groupBy(fn ($expense) => $expense->category ?: 'Uncategorized')
                    ->map(fn ($items, $category) => [
                        'category' => $category,
                        'amount' => (float) $items->sum(fn ($expense) => (float) $expense->amount),
                        'count' => $items->count(),
                    ])->values(),
                'income' => $payments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'receipt_number' => $payment->receipt_number,
                    'amount_paid' => (float) $payment->amount_paid,
                    'payment_date' => $payment->payment_date?->toDateString(),
                    'payment_method' => $payment->payment_method,
                    'transaction_reference' => $payment->transaction_reference,
                    'student_name' => $payment->studentFee?->studentEnrollment?->student?->full_name,
                ])->values(),
                'expenses' => $expenses->map(fn ($expense) => [
                    'id' => $expense->id,
                    'title' => $expense->title,
                    'category' => $expense->category,
                    'amount' => (float) $expense->amount,
                    'expense_date' => $expense->expense_date?->toDateString(),
                    'description' => $expense->description,
                ])->values(),
            ],
        ]);
    }
}
