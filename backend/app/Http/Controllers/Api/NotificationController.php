<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function incidentIdFromType(string $type): ?int
    {
        if (preg_match('/:(\d+)$/', $type, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function cleanupDuplicates(int $userId): void
    {
        $items = Notification::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        $seen = [];
        $duplicates = [];

        foreach ($items as $item) {
            $key = implode('|', [
                $item->type,
                $item->title,
                $item->body,
            ]);

            if (isset($seen[$key])) {
                $duplicates[] = $item->id;
                continue;
            }

            $seen[$key] = true;
        }

        if (!empty($duplicates)) {
            Notification::whereIn('id', $duplicates)->delete();
        }
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $this->cleanupDuplicates($user->id);

        $items = Notification::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function (Notification $notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'body' => $notification->body,
                    'read_at' => $notification->read_at,
                    'created_at' => $notification->created_at,
                    'incident_id' => $this->incidentIdFromType($notification->type),
                ];
            })
            ->values();

        return response()->json(['notifications' => $items]);
    }

    public function markRead(Request $request, int $id)
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->read_at = now();
        $notification->save();

        return response()->json(['notification' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();
        Notification::where('user_id', $user->id)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'ok']);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }
}
