<?php

namespace App\Console\Commands;

use App\Models\LiveRoomRecording;
use App\Services\MediaStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class PurgeExpiredLiveRoomRecordings extends Command
{
    protected $signature = 'live-rooms:purge-recordings';
    protected $description = 'Delete expired live-room recording files and metadata.';

    public function handle(MediaStorageService $media): int
    {
        if (! Schema::hasTable('live_room_recordings')) {
            $this->info('Recording table is not available; nothing to purge.');
            return self::SUCCESS;
        }

        $count = 0;
        LiveRoomRecording::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->whereIn('status', ['completed', 'failed'])
            ->chunkById(100, function ($recordings) use ($media, &$count): void {
                foreach ($recordings as $recording) {
                    $media->delete($recording->file_path);
                    $recording->delete();
                    $count++;
                }
            });

        $this->info("Purged {$count} expired live-room recording(s).");
        return self::SUCCESS;
    }
}
