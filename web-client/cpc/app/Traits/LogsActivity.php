<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

trait LogsActivity
{
    protected function logActivity(string $module, string $action, string $description, $subject = null): void
    {
        ActivityLog::create([
            'user_id'      => Auth::id(),
            'module'       => $module,
            'action'       => $action,
            'description'  => $description,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id'   => $subject?->id,
        ]);
    }
}