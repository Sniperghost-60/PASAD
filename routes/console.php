<?php

use App\Models\DataExport;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    DataExport::query()
        ->whereNotNull('expires_at')
        ->where('expires_at', '<=', now())
        ->whereNotNull('path')
        ->eachById(function (DataExport $export) {
            Storage::disk($export->disk)->delete($export->path);
            $export->update(['status' => 'expired', 'path' => null]);
        });
})->hourly()->name('purge-expired-data-exports')->withoutOverlapping();
