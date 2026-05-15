<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    private function countStatuses($query, array $names): int
    {
        return (clone $query)->whereHas('status', function ($statusQuery) use ($names) {
            $statusQuery->whereIn('name', $names);
        })->count();
    }

    public function system(Request $request)
    {
        $role = $request->user()->role?->name;
        if (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $open = IncidentStatus::where('name', 'abierta')->value('id');
        $closedIds = IncidentStatus::whereIn('name', ['resuelta', 'cerrada'])->pluck('id');

        $assignmentModes = CompanySetting::select('assignment_mode', DB::raw('COUNT(*) as total'))
            ->groupBy('assignment_mode')
            ->pluck('total', 'assignment_mode');

        return response()->json([
            'companies' => Company::count(),
            'users' => User::count(),
            'companies_with_branding' => CompanySetting::where(function ($query) {
                $query->whereNotNull('logo')
                    ->orWhereNotNull('system_name')
                    ->orWhereNotNull('favicon');
            })->count(),
            'companies_auto_assignment' => $assignmentModes->get('auto', 0),
            'companies_specialty_assignment' => $assignmentModes->get('specialty', 0),
            'companies_manual_assignment' => $assignmentModes->get('manual', 0),
            'open' => $open ? Incident::where('status_id', $open)->count() : 0,
            'closed' => $closedIds->isNotEmpty() ? Incident::whereIn('status_id', $closedIds)->count() : 0,
            'textocambios' => 'Se han retirado las estadísticas de incidencias para administradores y supervisores, y se han añadido nuevos parámetros de configuración de empresa.',
        ]);
    }

    public function company(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->name;
        if ($role !== 'jefe_empresa') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $query = Incident::where('company_id', $user->company_id);

        return response()->json([
            'employees' => User::where('company_id', $user->company_id)->count(),
            'incidents' => (clone $query)->count(),
            'open' => $this->countStatuses($query, ['abierta']),
            'in_progress' => $this->countStatuses($query, ['en_progreso']),
            'closed' => $this->countStatuses($query, ['resuelta', 'cerrada']),
        ]);
    }

    public function byCompany(Request $request)
    {
        $role = $request->user()->role?->name;
        if (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $rows = Incident::select('company_id', DB::raw('COUNT(*) as total'))
            ->groupBy('company_id')
            ->with('company')
            ->get()
            ->map(function ($row) {
                return [
                    'company_id' => $row->company_id,
                    'company' => $row->company?->name,
                    'total' => (int) $row->total,
                ];
            });

        return response()->json(['by_company' => $rows]);
    }

    public function byTechnician(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->name;
        if ($role !== 'jefe_empresa') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $rows = Incident::select('assigned_to', DB::raw('COUNT(*) as total'))
            ->where('company_id', $user->company_id)
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->with('assignee')
            ->get()
            ->map(function ($row) {
                return [
                    'technician_id' => $row->assigned_to,
                    'technician' => $row->assignee?->name,
                    'total' => (int) $row->total,
                ];
            });

        return response()->json(['by_technician' => $rows]);
    }

    public function incidents(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->name;

        $query = Incident::query();
        if ($role === 'jefe_empresa' || $role === 'tecnico') {
            $query->where('company_id', $user->company_id);
        } elseif ($role === 'empleado') {
            $query->where('created_by', $user->id);
        } elseif (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $total = (clone $query)->count();
        $open = (clone $query)->whereHas('status', fn ($s) => $s->where('name', 'abierta'))->count();
        $closed = (clone $query)->whereHas('status', fn ($s) => $s->whereIn('name', ['resuelta', 'cerrada']))->count();

        $byStatus = (clone $query)
            ->select('status_id', DB::raw('COUNT(*) as total'))
            ->groupBy('status_id')
            ->with('status')
            ->get()
            ->map(function ($row) {
                return [
                    'status' => $row->status?->name ?? 'sin_estado',
                    'total' => (int) $row->total,
                ];
            })
            ->values();

        $trend = (clone $query)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => ['day' => $row->day, 'total' => (int) $row->total])
            ->values();

        $avgResolutionHours = (clone $query)
            ->whereHas('status', fn ($s) => $s->whereIn('name', ['resuelta', 'cerrada']))
            ->whereNotNull('updated_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours')
            ->value('avg_hours');

        return response()->json([
            'metrics' => [
                'total' => $total,
                'open' => $open,
                'closed' => $closed,
                'avg_resolution_hours' => $avgResolutionHours ? round((float) $avgResolutionHours, 2) : 0,
            ],
            'by_status' => $byStatus,
            'trend' => $trend,
        ]);
    }
}
