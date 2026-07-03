<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\CSV\Options as CsvOptions;
use OpenSpout\Writer\CSV\Writer as CsvWriter;
use OpenSpout\Writer\WriterInterface;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

class DataExportController extends Controller
{
    /**
     * Colonnes sensibles jamais incluses dans un export, quel que soit le modèle.
     */
    private const EXCLUDED_COLUMNS = [
        'password', 'remember_token',
        'two_factor_secret', 'two_factor_recovery_codes',
    ];

    /**
     * Liste des jeux de données exportables, groupés pour l'UI.
     */
    public function datasets()
    {
        $datasets = collect(config('exportable_datasets'))
            ->map(fn ($dataset, $key) => [
                'key'   => $key,
                'label' => $dataset['label'],
                'group' => $dataset['group'],
            ])
            ->values()
            ->groupBy('group');

        return response()->json($datasets);
    }

    public function export(Request $request)
    {
        $validated = $request->validate([
            'type'      => ['required', 'string', Rule::in(array_keys(config('exportable_datasets')))],
            'format'    => ['required', 'string', 'in:csv,xlsx,pdf'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
        ]);

        $dataset    = config('exportable_datasets.'.$validated['type']);
        $modelClass = $dataset['model'];
        $model      = new $modelClass();
        $table      = $model->getTable();
        $hasDates   = Schema::hasColumn($table, 'created_at');

        $query = $modelClass::query();
        if ($hasDates && ! empty($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }
        if ($hasDates && ! empty($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $rows = $query->orderBy($model->getKeyName())->get();

        [$headers, $data] = $this->flatten($rows, $table);

        $filename = $validated['type'].'-'.now()->format('Y-m-d_His');

        return match ($validated['format']) {
            'csv'  => $this->exportCsv($headers, $data, $filename),
            'xlsx' => $this->exportXlsx($headers, $data, $filename),
            'pdf'  => $this->exportPdf($dataset['label'], $headers, $data, $filename),
        };
    }

    /**
     * Aplatit les modèles (y compris les colonnes JSON) en lignes tabulaires,
     * avec une liste de colonnes = union ordonnée des clés rencontrées.
     */
    private function flatten(Collection $rows, string $table): array
    {
        if ($rows->isEmpty()) {
            return [array_diff(Schema::getColumnListing($table), self::EXCLUDED_COLUMNS), []];
        }

        $headers  = [];
        $flatRows = [];

        foreach ($rows as $row) {
            $flat = [];
            foreach ($row->toArray() as $key => $value) {
                if (in_array($key, self::EXCLUDED_COLUMNS, true)) {
                    continue;
                }
                if (is_array($value)) {
                    foreach (Arr::dot($value, $key.'.') as $dotKey => $dotValue) {
                        $flat[$dotKey] = is_array($dotValue) ? json_encode($dotValue, JSON_UNESCAPED_UNICODE) : $dotValue;
                    }
                } else {
                    $flat[$key] = $value;
                }
            }

            foreach (array_keys($flat) as $key) {
                if (! in_array($key, $headers, true)) {
                    $headers[] = $key;
                }
            }

            $flatRows[] = $flat;
        }

        $data = array_map(function ($flat) use ($headers) {
            return array_map(function ($header) use ($flat) {
                $value = $flat[$header] ?? null;

                return match (true) {
                    is_bool($value) => $value ? 'Oui' : 'Non',
                    is_null($value) => '',
                    default          => (string) $value,
                };
            }, $headers);
        }, $flatRows);

        return [$headers, $data];
    }

    private function exportCsv(array $headers, array $data, string $filename)
    {
        $writer = new CsvWriter(new CsvOptions(FIELD_DELIMITER: ';'));

        return $this->streamSpreadsheet($writer, $headers, $data, "{$filename}.csv", 'text/csv; charset=UTF-8');
    }

    private function exportXlsx(array $headers, array $data, string $filename)
    {
        $writer = new XlsxWriter();

        return $this->streamSpreadsheet($writer, $headers, $data, "{$filename}.xlsx", 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    private function streamSpreadsheet(WriterInterface $writer, array $headers, array $data, string $downloadName, string $contentType)
    {
        return response()->streamDownload(function () use ($writer, $headers, $data) {
            $writer->openToFile('php://output');
            $writer->addRow(Row::fromValues($headers));
            foreach ($data as $row) {
                $writer->addRow(Row::fromValues($row));
            }
            $writer->close();
        }, $downloadName, ['Content-Type' => $contentType]);
    }

    private function exportPdf(string $title, array $headers, array $data, string $filename)
    {
        $pdf = Pdf::loadView('exports.data-table', [
            'title'   => $title,
            'headers' => $headers,
            'rows'    => $data,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("{$filename}.pdf");
    }
}
