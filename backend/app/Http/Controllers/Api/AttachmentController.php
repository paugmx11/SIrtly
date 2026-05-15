<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function index(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $attachments = IncidentAttachment::where('incident_id', $incident->id)
            ->get()
            ->map(function (IncidentAttachment $attachment) {
                return [
                    'id' => $attachment->id,
                    'incident_id' => $attachment->incident_id,
                    'file_path' => $attachment->file_path,
                    'file_name' => basename($attachment->file_path),
                    'uploaded_by' => $attachment->uploaded_by,
                    'created_at' => $attachment->created_at,
                    'updated_at' => $attachment->updated_at,
                    'url' => url(Storage::disk('public')->url($attachment->file_path)),
                ];
            })
            ->values();

        return response()->json(['attachments' => $attachments]);
    }

    public function store(Request $request, int $id)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($id);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $payload = $request->all();
        if (empty($payload) && str_contains((string) $request->header('Content-Type'), 'application/json')) {
            $payload = json_decode($request->getContent(), true) ?: [];
        }

        $action = $payload['_action'] ?? $request->query('_action');
        $attachmentId = (int) ($payload['attachment_id'] ?? $request->query('attachment_id') ?? 0);

        if ($action === 'delete' && $attachmentId > 0) {
            $attachment = IncidentAttachment::where('incident_id', $incident->id)->findOrFail($attachmentId);

            if ($attachment->file_path) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            return response()->json(['message' => 'Attachment deleted successfully.']);
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
            'url' => url(Storage::disk('public')->url($path)),
        ], 201);
    }

    public function destroy(Request $request, int $incidentId, int $attachmentId)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($incidentId);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $attachment = IncidentAttachment::where('incident_id', $incident->id)->findOrFail($attachmentId);

        if ($attachment->file_path) {
            Storage::disk('public')->delete($attachment->file_path);
        }

        $attachment->delete();

        return response()->json(['message' => 'Attachment deleted successfully.']);
    }

    public function download(Request $request, int $incidentId, int $attachmentId)
    {
        $user = $request->user();
        $incident = Incident::findOrFail($incidentId);

        if ($user->role?->name !== 'admin' && $user->role?->name !== 'supervisor' && $incident->company_id !== $user->company_id) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $attachment = IncidentAttachment::where('incident_id', $incident->id)->findOrFail($attachmentId);

        if (!Storage::disk('public')->exists($attachment->file_path)) {
            abort(404);
        }

        return Storage::disk('public')->response(
            $attachment->file_path,
            basename($attachment->file_path),
            [
                'Content-Disposition' => 'inline; filename="' . basename($attachment->file_path) . '"',
            ],
        );
    }
}
