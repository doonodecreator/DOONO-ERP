<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupportAttachmentService
{
    public function store(UploadedFile $file, int $ticketId): array
    {
        $disk = Storage::disk('support_private');
        $safeName = Str::uuid()->toString().'.'.strtolower($file->getClientOriginalExtension());
        $path = $file->storeAs('tickets/'.$ticketId, $safeName, 'support_private');

        return [
            'path' => $path,
            'original_filename' => Str::limit($file->getClientOriginalName(), 255, ''),
            'mime_type' => $disk->mimeType($path) ?: $file->getMimeType() ?: 'application/octet-stream',
            'size_bytes' => (int) ($disk->size($path) ?: $file->getSize()),
        ];
    }

    public function download(string $path)
    {
        $disk = Storage::disk('support_private');
        abort_unless($disk->exists($path), 404, 'Attachment not found.');

        return $disk->download($path);
    }
}
