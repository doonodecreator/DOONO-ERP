<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\FeePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

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

        $allPaymentsQuery = FeePayment::query()
            ->whereHas('studentFee.studentEnrollment.student', fn ($query) => $query->where('school_id', $schoolId))
            ->with(['studentFee.studentEnrollment.student', 'reversedBy:id,name'])
            ->when($from, fn ($query) => $query->whereDate('payment_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('payment_date', '<=', $to));
        $paymentsQuery = (clone $allPaymentsQuery)->whereNull('reversed_at');
        $reversedPaymentsQuery = (clone $allPaymentsQuery)->whereNotNull('reversed_at');

        $expensesQuery = Expense::query()
            ->where('school_id', $schoolId)
            ->when($from, fn ($query) => $query->whereDate('expense_date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('expense_date', '<=', $to));

        $payments = $paymentsQuery->latest('payment_date')->get();
        $reversedPayments = $reversedPaymentsQuery->latest('reversed_at')->get();
        $expenses = $expensesQuery->latest('expense_date')->get();
        $incomeTotal = (float) $payments->sum(fn ($payment) => (float) $payment->amount_paid);
        $reversedTotal = (float) $reversedPayments->sum(fn ($payment) => (float) $payment->amount_paid);
        $expenseTotal = (float) $expenses->sum(fn ($expense) => (float) $expense->amount);
        $schoolSettings = DB::table('school_settings')->where('school_id', $schoolId)->first();
        $taxEnabled = (bool) ($schoolSettings?->tax_enabled ?? false);
        $taxRate = $taxEnabled && is_numeric($schoolSettings?->tax_rate) ? (float) $schoolSettings->tax_rate : null;
        $taxAmount = $taxRate !== null ? round($incomeTotal * ($taxRate / 100), 2) : null;

        return response()->json([
            'data' => [
                'filters' => [
                    'from' => $from?->toDateString(),
                    'to' => $to?->toDateString(),
                ],
                'summary' => [
                    'income' => $incomeTotal,
                    'taxable_income' => $incomeTotal,
                    'expenses' => $expenseTotal,
                    'profit_loss' => $incomeTotal - $expenseTotal,
                    'payment_count' => $payments->count(),
                    'reversed_payment_count' => $reversedPayments->count(),
                    'reversed_income' => $reversedTotal,
                    'expense_count' => $expenses->count(),
                ],
                'tax' => [
                    'enabled' => $taxEnabled,
                    'name' => $schoolSettings?->tax_name,
                    'rate' => $taxRate,
                    'identifier' => $schoolSettings?->tax_identifier,
                    'amount' => $taxAmount,
                    'basis' => 'Recognized, non-reversed fee payments in the selected period.',
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
                'reversed_payments' => $reversedPayments->map(fn ($payment) => [
                    'id' => $payment->id,
                    'receipt_number' => $payment->receipt_number,
                    'amount_paid' => (float) $payment->amount_paid,
                    'payment_date' => $payment->payment_date?->toDateString(),
                    'reversed_at' => $payment->reversed_at?->toISOString(),
                    'reversal_reason' => $payment->reversal_reason,
                    'reversed_by' => $payment->reversedBy?->name,
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
