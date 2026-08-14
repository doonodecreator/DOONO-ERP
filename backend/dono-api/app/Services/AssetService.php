<?php

namespace App\Services;

use App\Models\Asset;
use Illuminate\Support\Facades\DB;

class AssetService
{
    public function create(array $data): Asset
    {
        return DB::transaction(function () use ($data) {
            $schoolId = $data['school_id'];
            $prefix = 'AS-' . now()->format('Y') . '-';

            $lastAsset = Asset::where('school_id', $schoolId)
                ->where('asset_number', 'like', $prefix . '%')
                ->lockForUpdate()
                ->latest('id')
                ->first();

            $sequence = $lastAsset
                ? ((int) substr($lastAsset->asset_number, strlen($prefix))) + 1
                : 1;

            return Asset::create([
                ...$data,
                'asset_number' => $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT),
            ]);
        });
    }
}
