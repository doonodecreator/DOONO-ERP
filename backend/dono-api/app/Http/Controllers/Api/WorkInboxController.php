<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\WorkInboxService;
use Illuminate\Http\Request;

class WorkInboxController extends Controller
{
    public function __construct(private WorkInboxService $inbox) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->inbox->for($request->user()),
        ]);
    }
}
