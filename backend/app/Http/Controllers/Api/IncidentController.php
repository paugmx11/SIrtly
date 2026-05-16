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

    private function technicianCandidates(int $companyId)
    {
        return User::query()
            ->where('company_id', $companyId)
            ->where('active', true)
            ->whereHas('role', function ($q) {
                $q->where('name', 'tecnico');
            });
    }

    private function pickLeastLoadedTechnician($query): ?int
    {
        return $query
            ->withCount([
                'assignedIncidents as active_workload' => function ($incidentQuery) {
                    $incidentQuery->whereHas('status', function ($statusQuery) {
                        $statusQuery->whereIn('name', ['abierta', 'en_progreso']);
                    });
                },
            ])
            ->orderBy('active_workload')
            ->orderBy('id')
            ->value('id');
    }

    private function resolveAssignment(int $companyId, string $assignmentMode, ?string $category): ?int
    {
        $technicians = $this->technicianCandidates($companyId);

        if ($assignmentMode === 'specialty' && $category) {
            $match = $this->pickLeastLoadedTechnician(
                (clone $technicians)->where('specialty', 'LIKE', '%' . $category . '%')
            );

            if ($match) {
                return $match;
            }
        }

        if (in_array($assignmentMode, ['auto', 'specialty'], true)) {
            return $this->pickLeastLoadedTechnician(clone $technicians);
        }

        return null;
    }

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

    public function index(Request $request)
    {
        $user = $request->user();
        $roleName = $user->role?->name;

        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'role' => ['nullable', Rule::in(['empleado', 'tecnico', 'jefe_empresa'])],
            'status' => ['nullable', 'string', 'max:120'],
            'search' => ['nullable', 'string', 'max:150'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'dateFrom' => ['nullable', 'date'],
            'dateTo' => ['nullable', 'date'],
        ]);

        $query = Incident::query()
            ->with(['creator', 'assignee', 'status'])
            ->orderByDesc('created_at');

        if ($roleName === 'jefe_empresa') {
            $query->where('company_id', $user->company_id);
        } elseif ($roleName === 'tecnico') {
            // For technicians: show available incidents (unassigned) OR their own assigned incidents
            $query->where('company_id', $user->company_id)
                ->where(function ($q) use ($user) {
                    $q->whereNull('assigned_to')
                      ->orWhere('assigned_to', $user->id);
                });
        } elseif ($roleName === 'empleado') {
            $query->where('created_by', $user->id);
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if (!empty($validated['role'])) {
            if ($validated['role'] === 'empleado') {
                $query->where('created_by', $user->id);
            }
            if ($validated['role'] === 'tecnico') {
                $query->whereNotNull('assigned_to');
            }
        }

        // Normalización: algunos sistemas pueden no devolver siempre `status.name` consistente.
        // Para evitar que el frontend no muestre incidencias por filtros basados en estado,
        // forzamos que el query incluya la relación `status` (ya se carga con ->with)
        // y añadimos un filtro adicional cuando el frontend pide `status`.


        if (!empty($validated['status'])) {
            $status = mb_strtolower(trim((string) $validated['status']));
            $statusName = self::STATUS_MAP[$status] ?? $status;
            $query->whereHas('status', function ($statusQuery) use ($statusName) {
                $statusQuery->whereRaw('LOWER(name) = ?', [$statusName]);
            });
        }

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($inner) use ($search) {
                $inner
                    ->where('title', 'LIKE', '%' . $search . '%')
                    ->orWhere('description', 'LIKE', '%' . $search . '%')
                    ->orWhere('category', 'LIKE', '%' . $search . '%')
                    ->orWhereHas('creator', function ($creatorQuery) use ($search) {
                        $creatorQuery
                            ->where('name', 'LIKE', '%' . $search . '%')
                            ->orWhere('last_name', 'LIKE', '%' . $search . '%')
                            ->orWhere('email', 'LIKE', '%' . $search . '%');
                    })
                    ->orWhereHas('assignee', function ($assigneeQuery) use ($search) {
                        $assigneeQuery
                            ->where('name', 'LIKE', '%' . $search . '%')
                            ->orWhere('last_name', 'LIKE', '%' . $search . '%')
                            ->orWhere('email', 'LIKE', '%' . $search . '%');
                    });
            });
        }

        if (!empty($validated['dateFrom'])) {
            $query->whereDate('created_at', '>=', $validated['dateFrom']);
        }

        if (!empty($validated['dateTo'])) {
            $query->whereDate('created_at', '<=', $validated['dateTo']);
        }

        $limit = (int) ($validated['limit'] ?? 10);
        $incidents = $query->paginate($limit)->appends($request->query());

        $statusBreakdown = [];
        foreach ($incidents->items() as $item) {
            $key = $item->status?->name ?? 'sin_estado';
            $statusBreakdown[$key] = ($statusBreakdown[$key] ?? 0) + 1;
        }

        return response()->json([
            'incidents' => $incidents->items(),
            'pagination' => [
                'page' => $incidents->currentPage(),
                'limit' => $incidents->perPage(),
                'total' => $incidents->total(),
                'lastPage' => $incidents->lastPage(),
            ],
            'metrics' => [
                'open' => $statusBreakdown['abierta'] ?? 0,
                'closed' => ($statusBreakdown['resuelta'] ?? 0) + ($statusBreakdown['cerrada'] ?? 0),
                'byStatus' => $statusBreakdown,
            ],
        ]);
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
            $assignedTo = $this->resolveAssignment(
                $user->company_id,
                $assignmentMode,
                $validated['category'] ?? null,
            );
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

        // Reload with relations for response
        $incident->load(['creator', 'assignee', 'status']);

        $technicianRecipients = $this->technicianCandidates($user->company_id)->pluck('id');
        $this->notifyUsers(
            $technicianRecipients,
            'incident_created:' . $incident->id,
            'Nueva incidencia',
            'Se ha creado: ' . $incident->title,
        );

        if ($assignedTo) {
            $this->notifyUsers(
                [$assignedTo],
                'incident_assigned:' . $incident->id,
                'Incidencia asignada',
                'Se te asignó: ' . $incident->title,
            );
        }

        return response()->json(['incident' => $incident], 201);
    }

    public function show(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role ? $user->role->name : null;

        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $query = Incident::with(['creator', 'assignee', 'status']);

        if (in_array($roleName, ['jefe_empresa', 'tecnico'], true)) {
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

        $this->notifyUsers(
            $targets,
            'incident_status:' . $incident->id,
            'Estado actualizado',
            'La incidencia "' . $incident->title . '" cambió a ' . $status->name,
        );

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

        // Reload with relations for response
        $incident->load(['creator', 'assignee', 'status']);

        $targets = collect([$incident->assigned_to, $incident->created_by])
            ->filter()
            ->unique()
            ->reject(fn ($id) => $id === $user->id);

        $this->notifyUsers(
            $targets,
            'incident_assigned:' . $incident->id,
            'Incidencia asignada',
            'Se te asignó: ' . $incident->title,
        );

        return response()->json(['incident' => $incident]);
    }

    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $roleName = $user->role?->name;

        $incident = Incident::findOrFail($id);
        if (in_array($roleName, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
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
            return response()->json(['message' => 'Not authorized.'], 403);
        } elseif ($roleName === 'jefe_empresa') {
            if ($incident->company_id !== $user->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        // Eliminación segura: garantiza que no queden registros huérfanos aunque
        // la FK de la BD no tenga ON DELETE CASCADE configurado correctamente.
        // 1) adjuntos + archivos físicos
        foreach ($incident->attachments()->get() as $attachment) {
            if ($attachment->file_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment->file_path);
            }
            $attachment->delete();
        }

        // 2) comentarios
        $incident->comments()->delete();

        // 3) notificaciones relacionadas (si se persisten por tipo/ID)
        \App\Models\Notification::whereIn('user_id', [$incident->assigned_to, $incident->created_by])
            ->where('type', 'incident_created:' . $incident->id)
            ->orWhere(function ($q) use ($incident) {
                $q->where('type', 'incident_assigned:' . $incident->id)
                  ->whereIn('user_id', [$incident->assigned_to, $incident->created_by]);
            })
            ->delete();

        $incident->delete();

        return response()->json(['message' => 'Incident deleted.']);
    }
}
