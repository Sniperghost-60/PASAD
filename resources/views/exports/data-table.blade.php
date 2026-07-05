<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
    @page { margin: 18px; }
    body { font-family: DejaVu Sans, sans-serif; color: #1e293b; }
    .report-header { border-bottom: 2px solid #334155; padding-bottom: 6px; margin-bottom: 10px; }
    h1 { font-size: 15px; margin: 0 0 3px; color: #0f172a; }
    p.meta { font-size: 9px; color: #64748b; margin: 0; }
    .section { margin-bottom: 14px; }
    .section.break { page-break-before: always; }
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    /* Bandeau de titre de fiche, comme la ligne de titre des aperçus */
    td.band { font-weight: bold; text-align: center; font-size: 10px; padding: 6px; }
    td.band.highlight { font-style: italic; }
    td.band .count { font-weight: normal; font-size: 7px; }
    th, td {
        padding: 4px 6px;
        font-size: 7.5px;
        text-align: left;
        vertical-align: top;
        white-space: pre-line;
        word-break: break-word;
    }
    th { font-weight: bold; }
    th.upper { text-transform: uppercase; }
    /* En-tête "données métier", distingué du contexte géographique (voir
       contentColumnIndices() côté contrôleur) : fond gris, italique, casse d'origine. */
    th.content-col { background-color: #d9d9d9 !important; font-style: italic; color: #000; }
    /* Colonnes "une entrée par ligne" (ex : Membres, Domaine, Score, Rang) : jamais de
       retour à la ligne automatique, pour rester synchronisées avec les colonnes voisines. */
    th.nowrap, td.nowrap { white-space: pre; word-break: normal; }
    /* Grille par village (voir domainesBlocks() côté contrôleur) : bandeau une fois,
       puis un sous-titre + mini en-tête + lignes de domaines pour chaque village. */
    .block-wrap { margin-bottom: 10px; }
    td.block-subtitle { background-color: #062824; color: #fff; font-style: italic; font-weight: bold; font-size: 9px; padding: 5px 7px; border: 1px solid #000; }
    th.block-head { background-color: #d9d9d9; color: #000; text-align: left; }
    td.block-domaine { font-weight: bold; }
    /* En-tête à deux lignes fusionnées (voir buildGridHeaderRows() côté contrôleur),
       ex : Bilan mensuel des sessions d'animation du CEP. */
    th.grid-head { background-color: #d9d9d9; text-align: center; }
</style>
</head>
<body>
    <div class="report-header">
        <h1>{{ $title }}</h1>
        <p class="meta">
            Export généré le {{ now()->format('d/m/Y à H:i') }}
            — {{ collect($sections)->sum(fn ($s) => count($s['rows'])) }} ligne(s)
            @if (count($sections) > 1)
                — {{ count($sections) }} fiches
            @endif
        </p>
    </div>

    @foreach ($sections as $section)
        @php
            $theme    = $section['theme'];
            $cellCss  = 'border: 1px solid '.$theme['border'].';';
            $headCss  = $cellCss.' background-color: '.$theme['head_bg'].'; color: '.$theme['head_text'].';';
        @endphp
        <div class="section {{ ! $loop->first ? 'break' : '' }}">
            @if ($section['blocks'] ?? null)
                <table>
                    <tr>
                        <td class="band" colspan="3" style="{{ $cellCss }} background-color: {{ $theme['band_bg'] }}; color: {{ $theme['band_text'] }};">
                            {{ $section['blocks']['band'] }}
                        </td>
                    </tr>
                </table>
                @foreach ($section['blocks']['items'] as $block)
                    <table class="block-wrap">
                        <thead>
                            <tr>
                                <td class="block-subtitle" colspan="3">{{ $block['subtitle'] }}</td>
                            </tr>
                            <tr>
                                @foreach ($block['columns'] as $col)
                                    <th class="block-head" style="{{ $cellCss }}">{{ $col }}</th>
                                @endforeach
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($block['rows'] as $row)
                                <tr>
                                    @foreach ($row as $i => $cell)
                                        <td class="{{ $i === 0 ? 'block-domaine' : '' }}" style="{{ $cellCss }}">{{ $cell }}</td>
                                    @endforeach
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                @endforeach
            @elseif ($section['gridHeader'] ?? null)
                <table>
                    <thead>
                        <tr>
                            <td class="band" colspan="{{ max(count($section['headers']), 1) }}"
                                style="{{ $cellCss }} background-color: #{{ $section['gridHeader']['band_bg'] }}; color: #000;">
                                {{ $section['title'] }}
                                <span class="count">({{ count($section['rows']) }} ligne(s))</span>
                            </td>
                        </tr>
                        <tr>
                            @foreach ($section['gridHeader']['rows'][0] as $cell)
                                <th class="grid-head" colspan="{{ $cell['colspan'] }}" rowspan="{{ $cell['rowspan'] }}"
                                    style="{{ $cellCss }} {{ $cell['bg'] ? 'background-color: #'.$cell['bg'].';' : '' }} {{ $cell['color'] ? 'color: #'.$cell['color'].';' : '' }}">{{ $cell['label'] }}</th>
                            @endforeach
                        </tr>
                        @if ($section['gridHeader']['rows'][1] !== [])
                            <tr>
                                @foreach ($section['gridHeader']['rows'][1] as $cell)
                                    <th class="grid-head" style="{{ $cellCss }} {{ $cell['bg'] ? 'background-color: #'.$cell['bg'].';' : '' }} {{ $cell['color'] ? 'color: #'.$cell['color'].';' : '' }}">{{ $cell['label'] }}</th>
                                @endforeach
                            </tr>
                        @endif
                    </thead>
                    <tbody>
                        @forelse ($section['rows'] as $row)
                            <tr>
                                @foreach ($row as $i => $cell)
                                    <td class="{{ in_array($i, $section['noWrapColumns'] ?? []) ? 'nowrap' : '' }}"
                                        style="{{ $cellCss }}">{{ $cell }}</td>
                                @endforeach
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ max(count($section['headers']), 1) }}" style="{{ $cellCss }}">Aucune donnée.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            @else
                <table>
                    <thead>
                        <tr>
                            <td class="band {{ ($section['contentColumns'] ?? []) !== [] ? 'highlight' : '' }}" colspan="{{ max(count($section['headers']), 1) }}"
                                style="{{ $cellCss }} background-color: {{ $theme['band_bg'] }}; color: {{ $theme['band_text'] }};">
                                {{ $section['title'] }}
                                <span class="count">({{ count($section['rows']) }} ligne(s))</span>
                            </td>
                        </tr>
                        <tr>
                            @foreach ($section['headers'] as $i => $header)
                                @php $isContent = in_array($i, $section['contentColumns'] ?? []); @endphp
                                <th class="{{ in_array($i, $section['noWrapColumns'] ?? []) ? 'nowrap' : '' }} {{ $theme['uppercase'] && ! $isContent ? 'upper' : '' }} {{ $isContent ? 'content-col' : '' }}"
                                    style="{{ $isContent ? $cellCss : $headCss }}">{{ $header }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($section['rows'] as $row)
                            <tr>
                                @foreach ($row as $i => $cell)
                                    <td class="{{ in_array($i, $section['noWrapColumns'] ?? []) ? 'nowrap' : '' }}"
                                        style="{{ $cellCss }}">{{ $cell }}</td>
                                @endforeach
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ max(count($section['headers']), 1) }}" style="{{ $cellCss }}">Aucune donnée.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            @endif
        </div>
    @endforeach
</body>
</html>
