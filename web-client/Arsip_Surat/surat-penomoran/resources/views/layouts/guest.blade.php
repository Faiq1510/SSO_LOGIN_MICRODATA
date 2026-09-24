<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700&display=swap" rel="stylesheet" />

        <!-- Scripts & Styles -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans text-slate-100 antialiased bg-slate-950 min-h-screen flex flex-col justify-center items-center py-8 px-4 relative overflow-x-hidden">
        
        <!-- Ambient Glow Neon Lights Background -->
        <div class="fixed top-1/4 -left-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="fixed bottom-1/4 -right-20 w-96 h-96 bg-pink-600/30 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="fixed top-10 right-1/3 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Slot Content -->
        <div class="w-full flex flex-col items-center z-10">
            {{ $slot }}
        </div>
    </body>
</html>