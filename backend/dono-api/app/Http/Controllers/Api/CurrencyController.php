<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Services\ActivityLogService;
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

        ActivityLogService::log(
            module: 'currencies',
            action: 'created',
            description: "Currency \"{$currency->code}\" was created.",
            subject: $currency,
            properties: ['changed_fields' => array_keys($validated)],
        );

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

        ActivityLogService::log(
            module: 'currencies',
            action: 'updated',
            description: "Currency \"{$currency->code}\" was updated.",
            subject: $currency,
            properties: ['changed_fields' => array_keys($validated)],
        );

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
        $currencyCode = $currency->code;
        $currencyId = $currency->id;
        $currency->delete();

        ActivityLogService::log(
            module: 'currencies',
            action: 'deleted',
            description: "Currency \"{$currencyCode}\" was deleted.",
            properties: ['currency_id' => $currencyId],
        );

        return response()->json([
            'message' => 'Currency deleted successfully.'
        ]);
    }
}
