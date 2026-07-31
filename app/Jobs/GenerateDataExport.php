<?php

namespace App\Jobs;

use App\Http\Controllers\DataExportController;
use App\Models\DataExport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class GenerateDataExport implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 600;

    public bool $failOnTimeout = true;

    public function __construct(public string $exportId) {}

    public function handle(DataExportController $controller): void
    {
        set_time_limit(0);

        $export = DataExport::findOrFail($this->exportId);
        $export->update(['status' => 'processing', 'error' => null]);

        $parameters = array_filter([
            $export->scope === 'dataset' ? 'type' : 'group' => $export->selection,
            'format' => $export->format,
            'date_from' => $export->date_from?->toDateString(),
            'date_to' => $export->date_to?->toDateString(),
        ], fn ($value) => $value !== null && $value !== '');

        try {
            $request = Request::create('/internal/data-export', 'GET', $parameters);
            $response = $export->scope === 'dataset'
                ? $controller->export($request)
                : $controller->exportGroup($request);

            $extension = $export->scope === 'group' && $export->format === 'csv'
                ? 'zip'
                : $export->format;
            $path = "exports/{$export->user_id}/{$export->id}.{$extension}";
            $absolutePath = Storage::disk($export->disk)->path($path);

            if (! is_dir(dirname($absolutePath))) {
                mkdir(dirname($absolutePath), 0775, true);
            }

            $this->writeResponse($response, $absolutePath);

            $export->update([
                'status' => 'completed',
                'path' => $path,
                'filename' => $this->responseFilename($response)
                    ?? "export-{$export->id}.{$extension}",
                'completed_at' => now(),
                'expires_at' => now()->addDay(),
            ]);
        } catch (Throwable $exception) {
            $export->update([
                'status' => 'failed',
                'error' => mb_substr($exception->getMessage(), 0, 2000),
            ]);

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        DataExport::whereKey($this->exportId)->update([
            'status' => 'failed',
            'error' => mb_substr($exception?->getMessage() ?? 'Le délai maximal de génération a été dépassé.', 0, 2000),
        ]);
    }

    private function writeResponse(Response $response, string $absolutePath): void
    {
        if ($response instanceof BinaryFileResponse) {
            $source = $response->getFile()->getPathname();
            copy($source, $absolutePath);
            @unlink($source);

            return;
        }

        if ($response instanceof StreamedResponse) {
            $handle = fopen($absolutePath, 'wb');
            ob_start(function (string $chunk) use ($handle): string {
                fwrite($handle, $chunk);

                return '';
            }, 64 * 1024);

            try {
                $response->sendContent();
            } finally {
                ob_end_flush();
                fclose($handle);
            }

            return;
        }

        file_put_contents($absolutePath, $response->getContent());
    }

    private function responseFilename(Response $response): ?string
    {
        $disposition = $response->headers->get('Content-Disposition', '');

        if (preg_match('/filename="?([^";]+)"?/i', $disposition, $matches)) {
            return basename($matches[1]);
        }

        return null;
    }
}
