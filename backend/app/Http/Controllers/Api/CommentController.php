<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Incident;
use App\Models\Notification;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    private function notifyUsers(iterable $userIds, string $type, string $title, string $body): void
    {
        collect($userIds)
            ->filter()
            ->unique()
            ->each(function ($targetId) use ($type, $title, $body) {
                $exists = Notification::where('user_id', $targetId)
                    ->where('type', $type)
                    ->where('title', $title)
                    ->where('body', $body)
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->exists();

                if (!$exists) {
                    Notification::create([
                        'user_id' => $targetId,
                        'type' => $type,
                        'title' => $title,
                        'body' => $body,
                    ]);
                }
            });
    }

    public function index(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::with('comments.user')->findOrFail($id);

        if ($user->role?->name === 'admin' || $user->role?->name === 'supervisor') {
            return response()->json(['comments' => $incident->comments]);
        }

        if ($incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json(['comments' => $incident->comments]);
    }

    public function store(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'comment' => ['required', 'string'],
        ]);

        $comment = Comment::create([
            'incident_id' => $incident->id,
            'user_id' => $user->id,
            'comment' => $validated['comment'],
        ]);

        $targets = collect([$incident->assigned_to, $incident->created_by])
            ->filter()
            ->unique()
            ->reject(fn ($id) => $id === $user->id);

        $this->notifyUsers(
            $targets,
            'comment:' . $incident->id,
            'Nuevo comentario',
            'Nuevo comentario en: ' . $incident->title,
        );

        return response()->json(['comment' => $comment], 201);
    }

    public function update(Request $request, int $id, int $commentId)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);
        $comment = Comment::where('incident_id', $incident->id)->findOrFail($commentId);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if ($comment->user_id !== $user->id && $user->role?->name !== 'admin' && $user->role?->name !== 'supervisor') {
            return response()->json(['message' => 'Only the author can edit this comment.'], 403);
        }

        $validated = $request->validate([
            'comment' => ['required', 'string'],
        ]);

        $comment->update(['comment' => $validated['comment']]);

        return response()->json(['comment' => $comment]);
    }

    public function destroy(Request $request, int $id, int $commentId)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);
        $comment = Comment::where('incident_id', $incident->id)->findOrFail($commentId);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if ($comment->user_id !== $user->id && $user->role?->name !== 'admin' && $user->role?->name !== 'supervisor') {
            return response()->json(['message' => 'Only the author can delete this comment.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully.']);
    }
}
