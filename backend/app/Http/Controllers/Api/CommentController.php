<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Incident;
use Illuminate\Http\Request;

class CommentController extends Controller
{
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

        return response()->json(['comment' => $comment], 201);
    }
}
