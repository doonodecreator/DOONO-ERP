<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GlobalSearchService;
use Illuminate\Http\Request;

class GlobalSearchController extends Controller
{
    public function __construct(private GlobalSearchService $search) {}

    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:80'],
            'type' => ['nullable', 'string', 'in:organizations,schools,students,parents,staff,enrollments,results'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:25'],
        ]);

        return response()->json([
            'success' => true,
            'data' => $this->search->search(
                $request->user(),
                $data['q'],
                $data['type'] ?? null,
                (int) ($data['limit'] ?? 10),
            ),
        ]);
    }
}
