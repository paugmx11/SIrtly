<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\IncidentStatusHistory;
use App\Models\CompanySetting;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class IncidentController extends Controller
{
    private const STATUS_MAP = [
        'open' => 'abierta',
        'in_progress' => 'en_progreso',
        'resolved' => 'resuelta',
        'closed' => 'cerrada',
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        $query = Incident::with(['creator', 'assignee', 'status'])->orderByDesc('created_at');

        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            $incidents = $query->get();
        } elseif ($roleName === 'jefe_empresa') {
            $incidents = $query->where('company_id', $user->company_id)->get();
        } elseif ($roleName === 'tecnico') {
            $incidents = $query->where('company_id', $user->company_id)->get();
        } elseif ($roleName === 'empleado') {
            $incidents = $query->where('created_by', $user->id)->get();
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json(['incidents' => $incidents]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        if ($roleName !== 'empleado') {
            return response()->json(['message' => 'Only empleado can create incidents.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:120'],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        if (isset($validated['assigned_to'])) {
            $sameCompany = User::where('id', $validated['assigned_to'])
                ->where('company_id', $user->company_id)
                ->exists();

            if (!$sameCompany) {
                return response()->json(['message' => 'Assignee must belong to your company.'], 422);
            }
        }

        $assignmentMode = CompanySetting::where('company_id', $user->company_id)->value('assignment_mode') ?? 'manual';

        $assignedTo = $validated['assigned_to'] ?? null;
        if (!$assignedTo && $assignmentMode !== 'manual') {
            $technicians = User::where('company_id', $user->company_id)
                ->whereHas('role', function ($q) {
                    $q->where('name', 'tecnico');
                });

            if ($assignmentMode === 'specialty' && !empty($validated['category'])) {
                $assignedTo = (clone $technicians)
                    ->where('specialty', 'LIKE', '%' . $validated['category'] . '%')
                    ->orderBy('id')
                    ->value('id');
            }

            if (!$assignedTo && $assignmentMode === 'auto') {
                $assignedTo = (clone $technicians)->orderBy('id')->value('id');
            }
        }

        $defaultStatus = IncidentStatus::where('name', self::STATUS_MAP['open'])->first();
        if (!$defaultStatus) {
            return response()->json(['message' => 'Default status not configured.'], 422);
        }

        $incident = Incident::create([
            'company_id' => $user->company_id,
            'created_by' => $user->id,
            'assigned_to' => $assignedTo,
            'status_id' => $defaultStatus->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'] ?? null,
            'priority' => $validated['priority'] ?? 'medium',
        ]);

        if ($assignedTo) {
            Notification::create([
                'user_id' => $assignedTo,
                'type' => 'incident',
                'title' => 'Incidencia asignada',
                'body' => 'Se te asignó: ' . $incident->title,
            ]);
        }

        return response()->json(['incident' => $incident], 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        $query = Incident::with(['creator', 'assignee', 'status']);

        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            $incident = $query->findOrFail($id);
        } elseif (in_array($roleName, ['jefe_empresa', 'tecnico'], true)) {
            $incident = $query->where('company_id', $user->company_id)->findOrFail($id);
        } elseif ($roleName === 'empleado') {
            $incident = $query->where('created_by', $user->id)->findOrFail($id);
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json(['incident' => $incident]);
    }

    public function updateStatus(Request $request, int $id)
    {
        $user = $request->user();

        $roleName = $user->role ? $user->role->name : null;
        if ($roleName !== 'tecnico') {
            return response()->json(['message' => 'Not authorized to update status.'], 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'resolved', 'closed'])],
        ]);

        $statusName = self::STATUS_MAP[$validated['status']] ?? null;
        $status = $statusName ? IncidentStatus::where('name', $statusName)->first() : null;
        if (!$status) {
            return response()->json(['message' => 'Status not configured.'], 422);
        }

        $incident = Incident::where('company_id', $user->company_id)->findOrFail($id);
        $incident->status_id = $status->id;
        $incident->save();

        IncidentStatusHistory::create([
            'incident_id' => $incident->id,
            'status_id' => $status->id,
            'changed_by' => $user->id,
        ]);

        $targets = collect([$incident->assigned_to, $incident->created_by])
            ->filter()
            ->unique()
            ->reject(fn ($id) => $id === $user->id);

        foreach ($targets as $targetId) {
            Notification::create([
                'user_id' => $targetId,
                'type' => 'incident',
                'title' => 'Estado actualizado',
                'body' => 'La incidencia "' . $incident->title . '" cambió a ' . $status->name,
            ]);
        }

        return response()->json(['incident' => $incident]);
    }

    public function assign(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        $incident = Incident::findOrFail($id);

        if ($roleName === 'tecnico') {
            if ($incident->company_id !== $user->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
            $incident->assigned_to = $user->id;
        } elseif ($roleName === 'jefe_empresa') {
            if ($incident->company_id !== $user->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
            $validated = $request->validate([
                'assigned_to' => ['required', 'integer', 'exists:users,id'],
            ]);
            $sameCompany = User::where('id', $validated['assigned_to'])
                ->where('company_id', $user->company_id)
                ->exists();
            if (!$sameCompany) {
                return response()->json(['message' => 'Assignee must belong to your company.'], 422);
            }
            $incident->assigned_to = $validated['assigned_to'];
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $incident->save();

        $targets = collect([$incident->assigned_to, $incident->created_by])
            ->filter()
            ->unique()
            ->reject(fn ($id) => $id === $user->id);

        foreach ($targets as $targetId) {
            Notification::create([
                'user_id' => $targetId,
                'type' => 'incident',
                'title' => 'Incidencia asignada',
                'body' => 'Se te asignó: ' . $incident->title,
            ]);
        }

        return response()->json(['incident' => $incident]);
    }

    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role?->name;

        $incident = Incident::findOrFail($id);
        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            // ok
        } elseif ($roleName === 'jefe_empresa') {
            if ($incident->company_id !== $user->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } elseif ($roleName === 'empleado') {
            if ($incident->created_by !== $user->id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'category' => ['sometimes', 'nullable', 'string', 'max:120'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
        ]);

        $incident->fill($validated);
        $incident->save();

        return response()->json(['incident' => $incident]);
    }

    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role?->name;

        $incident = Incident::findOrFail($id);
        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            // ok
        } elseif ($roleName === 'jefe_empresa') {
            if ($incident->company_id !== $user->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $incident->delete();

        return response()->json(['message' => 'Incident deleted.']);
    }
}
