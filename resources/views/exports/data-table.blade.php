<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 16px; }
    body { font-family: DejaVu Sans, sans-serif; color: #1e293b; }
    h1 { font-size: 14px; margin: 0 0 4px; }
    p.meta { font-size: 9px; color: #64748b; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td {
        border: 1px solid #cbd5e1;
        padding: 3px 5px;
        font-size: 7.5px;
        text-align: left;
        word-break: break-word;
    }
    th { background-color: #0f766e; color: #fff; font-weight: bold; }
    tr:nth-child(even) td { background-color: #f8fafc; }
</style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p class="meta">Export généré le {{ now()->format('d/m/Y à H:i') }} — {{ count($rows) }} ligne(s)</p>
    <table>
        <thead>
            <tr>
                @foreach ($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headers) }}">Aucune donnée.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
