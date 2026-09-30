<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
        {
            return [
                ...parent::share($request),

                'auth' => [
                    'user' => $request->user()
                        ? [
                            'id' => $request->user()->id,
                            'name' => $request->user()->name,
                            'email' => $request->user()->email,

                            // Role dari Spatie
                            'roles' => $request->user()->getRoleNames()->toArray(),

                            // Override visibilitas menu per user (dari Super Admin)
                            'menuOverrides' => $request->user()
                                ->menuOverrides
                                ->map(fn ($o) => [
                                    'menu_key' => $o->menu_key,
                                    'visible'  => $o->visible,
                                ])
                                ->values()
                                ->toArray(),
                        ]
                        : null,
                ],

                'notifications' => function () use ($request) {
                    if (!$request->user()) {
                        return ['items' => [], 'unreadCount' => 0];
                    }

                    $logs = ActivityLog::with('user:id,name')
                        ->latest()
                        ->limit(15)
                        ->get();

                    return [
                        'items'       => $logs,
                        'unreadCount' => ActivityLog::whereNull('read_at')->count(),
                    ];
                },
            ];
        }
}