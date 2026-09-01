<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use RuntimeException;

class UploadSecurityService
{
    private const MAX_BYTES = 10485760;

    private const MIME_BY_EXTENSION = [
        'pdf' => ['application/pdf'],
        'doc' => ['application/msword', 'application/octet-stream'],
        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
        'jpg' => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png' => ['image/png'],
        'txt' => ['text/plain', 'text/markdown'],
    ];

    public function validate(UploadedFile $file): void
    {
        if (! $file->isValid() || $file->getSize() > self::MAX_BYTES) {
            throw new RuntimeException('The uploaded file is invalid or exceeds the 10 MB limit.');
        }

        $extension = strtolower($file->getClientOriginalExtension());
        $mime = strtolower((string) $file->getMimeType());
        abort_unless(isset(self::MIME_BY_EXTENSION[$extension]), 422, 'This file type is not supported.');
        abort_unless(in_array($mime, self::MIME_BY_EXTENSION[$extension], true), 422, 'The file content does not match its extension.');

        if (in_array($extension, ['jpg', 'jpeg', 'png'], true)) {
            abort_unless(@getimagesize($file->getRealPath()) !== false, 422, 'The uploaded image could not be verified.');
        }
        if ($extension === 'pdf') {
            $handle = @fopen($file->getRealPath(), 'rb');
            $header = $handle ? fread($handle, 5) : '';
            if (is_resource($handle)) fclose($handle);
            abort_unless($header === '%PDF-', 422, 'The uploaded PDF could not be verified.');
        }

        $contents = @file_get_contents($file->getRealPath(), false, null, 0, 4096) ?: '';
        abort_if(str_contains($contents, 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE'), 422, 'The uploaded file was rejected by the malware signature check.');

        $scanner = trim((string) config('filesystems.upload_scanner', env('UPLOAD_SCANNER', '')));
        if ($scanner !== '') {
            $command = escapeshellcmd($scanner).' '.escapeshellarg($file->getRealPath());
            exec($command.' 2>&1', $output, $exitCode);
            abort_unless($exitCode === 0, 422, 'The uploaded file did not pass the configured malware scanner.');
        }
    }
}
