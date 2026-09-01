<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;

class VideoUploadSecurityService
{
    private const MAX_BYTES = 104857600;

    private const MIME_BY_EXTENSION = [
        'mp4' => ['video/mp4'],
        'webm' => ['video/webm'],
        'mov' => ['video/quicktime'],
    ];

    public function validate(UploadedFile $file): void
    {
        if (! $file->isValid() || (int) $file->getSize() > self::MAX_BYTES) {
            throw new RuntimeException('The video is invalid or exceeds the 100 MB limit.');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $mime = strtolower((string) $file->getMimeType());
        abort_unless(isset(self::MIME_BY_EXTENSION[$extension]), 422, 'Only MP4, WebM, and MOV videos are supported.');
        abort_unless(in_array($mime, self::MIME_BY_EXTENSION[$extension], true), 422, 'The video content does not match its extension.');

        $scanner = trim((string) config('filesystems.upload_scanner', env('UPLOAD_SCANNER', '')));
        if ($scanner !== '') {
            $command = escapeshellcmd($scanner) . ' ' . escapeshellarg($file->getRealPath());
            exec($command . ' 2>&1', $output, $exitCode);
            abort_unless($exitCode === 0, 422, 'The uploaded video did not pass the configured malware scanner.');
        }
    }
}
