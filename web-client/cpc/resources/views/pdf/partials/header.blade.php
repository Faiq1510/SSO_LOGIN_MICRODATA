@php
    $logoPath = public_path('images/logo.png');
    $logo = file_exists($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : null;
@endphp
<header>
    @if($logo)
        <img src="{{ $logo }}" alt="logo" class="logo" />
    @endif
    <div style="flex:1;">
        <div class="company">{{ config('app.name') }}</div>
        <div class="address muted">{{ config('app.address', '') }}</div>
    </div>
</header>
<hr style="margin-top:8px; margin-bottom:12px;" />
