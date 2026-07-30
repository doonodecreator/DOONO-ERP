<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    /**
     * Display all currencies.
     */
    public function index()
    {
        return response()->json([
            'data' => Currency::orderBy('name')->get()
        ]);
    }

    /**
     * Store a new currency.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:3|unique:currencies,code',
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric',
            'is_base' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $currency = Currency::create($validated);

        return response()->json([
            'message' => 'Currency created successfully.',
            'data' => $currency
        ], 201);
    }

    /**
     * Display one currency.
     */
    public function show(Currency $currency)
    {
        return response()->json([
            'data' => $currency
        ]);
    }

    /**
     * Update currency.
     */
    public function update(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:3|unique:currencies,code,' . $currency->id,
            'symbol' => 'required|string|max:10',
            'exchange_rate' => 'required|numeric',
            'is_base' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $currency->update($validated);

        return response()->json([
            'message' => 'Currency updated successfully.',
            'data' => $currency
        ]);
    }

    /**
     * Delete currency.
     */
    public function destroy(Currency $currency)
    {
        $currency->delete();

        return response()->json([
            'message' => 'Currency deleted successfully.'
        ]);
    }
}
