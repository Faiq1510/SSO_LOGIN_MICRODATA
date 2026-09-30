<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;

/**
 * @OA\Tag(
 *     name="Notifications",
 *     description="Tindakan notifikasi pengguna"
 * )
 */
class NotificationController extends Controller
{
    /**
     * @OA\Post(
     *     path="/notifications/{activityLog}/read",
     *     tags={"Notifications"},
     *     summary="Tandai notifikasi sebagai dibaca",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="activityLog", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah notifikasi dibaca")
     * )
     */
    public function read(ActivityLog $activityLog)
    {
        if (! $activityLog->read_at) {
            $activityLog->update(['read_at' => now()]);
        }

        return back();
    }

    public function readAll()
    {
        ActivityLog::whereNull('read_at')->update(['read_at' => now()]);

        return back();
    }
}