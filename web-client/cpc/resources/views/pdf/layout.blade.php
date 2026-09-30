<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name') }}</title>
    <style>
        /* Paper + baseline */
        @page { margin: 18mm 15mm; }
        body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; font-size: 12px; color: #222; line-height:1.35 }

        /* Header */
        header { display:flex; align-items:center; gap:12px; margin-bottom:8px }
        .logo { height:56px; }
        .company { font-weight:700; font-size:15px; }
        .address { font-size:11px; margin-top:2px; }

        .periode { text-align:center; margin:8px 0 12px 0; font-weight:600 }

        /* Tables */
        table.report-table { width:100%; border-collapse:collapse; table-layout:fixed; word-wrap:break-word }
        table.report-table th, table.report-table td { padding:6px 8px; border:1px solid #ddd; vertical-align:middle }
        table.report-table th { background:#f8f8f8; font-weight:700 }
        table.report-table td.text-right, table.report-table th.text-right { text-align:right }

        /* Accounting Tables (No Borders, Hierarchy) */
        table.accounting-table { width:100%; border-collapse:collapse; table-layout:fixed; word-wrap:break-word; border:none; }
        table.accounting-table th, table.accounting-table td { padding:4px 4px; border:none; vertical-align:top; }
        
        /* Column Widths (Can be overridden inline) */
        table.accounting-table .col-name { width:70%; }
        table.accounting-table .col-nominal { width:30%; text-align:right; }
        
        /* Typography */
        .text-bold { font-weight:bold; }
        .text-center { text-align:center; }
        .text-right { text-align:right; }

        /* Indentation */
        .indent-0 { padding-left:0 !important; }
        .indent-1 { padding-left:15px !important; }
        .indent-2 { padding-left:30px !important; }

        /* Rows */
        .row-category td { font-weight:bold; padding-top:15px; }
        .row-subcategory td { font-weight:bold; }
        .row-account td { font-weight:normal; }
        .row-subtotal td { font-weight:bold; }
        .row-total td { font-weight:bold; }
        .row-final-total td { font-weight:bold; padding-top:10px; padding-bottom:10px; }

        /* Borders for nominals */
        .border-single { border-top:1px solid #000; padding-top:2px; display:block; }
        .border-double { border-top:1px solid #000; border-bottom:1px solid #000; height:2px; padding-top:0; display:block; }

        .no-border { border:none }
        .muted { color:#666; font-size:11px }
        .signature { width:45%; display:inline-block; text-align:center; margin-top:40px }
        .page-number { position:fixed; bottom:10px; right:20px; font-size:10px }
        .avoid-break { page-break-inside:avoid; }
    </style>
    @stack('pdf-style')
</head>
<body>
    @include('pdf.partials.header')

    <div class="periode">{{ $periode ?? '' }}</div>

    <main>
        @yield('content')
    </main>

    <div style="width:100%; margin-top:18px;">
        @include('pdf.partials.signature')
    </div>

    <div class="page-number">
        <!-- page numbers injected by dompdf below -->
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $x = 520; $y = 820; $size = 10;
            $font = $fontMetrics->getFont("DejaVu Sans");
            $pdf->page_text($x, $y, "Halaman {PAGE_NUM} / {PAGE_COUNT}", $font, $size, array(0,0,0));
        }
    </script>
</body>
</html>
