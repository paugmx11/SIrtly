<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentAttachment;
use Illuminate\Http\Request;

class AttachmentController extends Controller
{
    public function index(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $attachments = IncidentAttachment::where('incident_id', $incident->id)->get();

        return response()->json(['attachments' => $attachments]);
    }

    public function store(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $path = $request->file('file')->store('attachments', 'public');

        $attachment = IncidentAttachment::create([
            'incident_id' => $incident->id,
            'file_path' => $path,
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'attachment' => $attachment,
            'url' => asset('storage/' . $path),
        ], 201);
    }
}
