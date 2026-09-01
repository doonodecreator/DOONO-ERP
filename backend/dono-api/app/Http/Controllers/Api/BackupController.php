<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\RunEncryptedBackupJob;
use App\Jobs\VerifyEncryptedBackupJob;
use App\Models\BackupRun;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    public function index(Request $request)
    {
        $runs = BackupRun::query()
            ->latest('id')
            ->paginate(min(max($request->integer('per_page', 25), 1), 100));

        $runs->getCollection()->transform(fn (BackupRun $run) => [
            'id' => $run->id,
            'status' => $run->status,
            'disk' => $run->disk,
            'path' => $run->path,
            'initiated_by' => $run->initiated_by,
            'bytes' => $run->bytes,
            'sha256' => $run->sha256,
            'started_at' => $run->started_at,
            'completed_at' => $run->completed_at,
            'failure_message' => $run->status === 'failed' ? $run->failure_message : null,
        ]);

        return response()->json($runs);
    }

    public function store(Request $request)
    {
        RunEncryptedBackupJob::dispatch($request->user()?->id)->onQueue('backups');

        return response()->json([
            'message' => 'Encrypted backup request queued. Refresh the backup list for the result.',
        ], 202);
    }

    public function verify(BackupRun $backupRun)
    {
        abort_unless($backupRun->status === 'succeeded' && $backupRun->path, 422, 'Only a completed backup with an encrypted artifact can be verified.');
        VerifyEncryptedBackupJob::dispatch($backupRun->id)->onQueue('backups');

        return response()->json([
            'message' => 'Encrypted backup verification queued. Refresh the backup list and inspect worker logs for the result.',
        ], 202);
    }
}
