<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaStorageService
{
    public function diskName(): string
    {
        return config('filesystems.default') === 's3' ? 's3' : 'public';
    }

    public function privateDiskName(): string
    {
        return 'assignment_private';
    }

    public function storePrivate(UploadedFile $file, string $directory, ?string $oldPath = null): string
    {
        if ($oldPath) {
            $this->delete($oldPath);
        }
        return $file->store(trim($directory, '/'), $this->privateDiskName());
    }

    public function storeImage(?UploadedFile $file, string $directory, ?string $oldPath = null): ?string
    {
        if (! $file) {
            return $oldPath;
        }

        $disk = $this->diskName();
        $path = $file->store(trim($directory, '/'), $disk);

        if ($oldPath && $oldPath !== $path) {
            $this->delete($oldPath);
        }

        return $path;
    }

    public function delete(?string $path): void
    {
        if (! $path || Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return;
        }

        foreach (array_unique([$this->diskName(), $this->privateDiskName()]) as $diskName) {
            $disk = Storage::disk($diskName);
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }

    public function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return $path;
        }

        return Storage::disk($this->diskName())->url($path);
    }

    public function privateExists(?string $path): bool
    {
        return (bool) $path && Storage::disk($this->privateDiskName())->exists($path);
    }

    public function privateDownload(string $path, string $name, string $extension = 'bin')
    {
        $disk = Storage::disk($this->privateDiskName());
        abort_unless($disk->exists($path), 404, 'The attachment is no longer available.');
        return $disk->download($path, $name.'.'.($extension ?: 'bin'));
    }

    public function inlineDataUri(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, 'data:')) {
            return $path;
        }

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        $disk = Storage::disk($this->diskName());
        if (! $disk->exists($path)) {
            return null;
        }

        $contents = $disk->get($path);
        $mime = $disk->mimeType($path) ?: 'application/octet-stream';

        return 'data:' . $mime . ';base64,' . base64_encode($contents);
    }
}
