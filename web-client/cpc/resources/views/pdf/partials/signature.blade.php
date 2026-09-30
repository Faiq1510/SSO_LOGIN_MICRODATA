<div style="width:100%; display:flex; justify-content:space-between; margin-top:18px; gap:10px;">
    <div class="signature" style="width:48%">
        <div class="muted">Dibuat oleh</div>
        <div style="height:64px"></div>
        <div><strong>{{ $createdBy ?? auth()->user()?->name ?? '________________' }}</strong></div>
        <div class="muted">{{ $createdByRole ?? 'Bagian Keuangan' }}</div>
    </div>

    <div class="signature" style="width:48%">
        <div class="muted">Mengetahui</div>
        <div style="height:64px"></div>
        <div><strong>{{ $approvedBy ?? '________________' }}</strong></div>
        <div class="muted">{{ $approvedByRole ?? 'Pimpinan' }}</div>
    </div>
</div>
