<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Incident;
use App\Models\IncidentStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function system(Request $request)
    {
        $role = $request->user()->role?->name;
        if (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $open = IncidentStatus::where('name', 'abierta')->value('id');
        $resolved = IncidentStatus::where('name', 'resuelta')->value('id');

        return response()->json([
            'companies' => Company::count(),
            'users' => User::count(),
            'incidents' => Incident::count(),
            'open' => $open ? Incident::where('status_id', $open)->count() : 0,
            'resolved' => $resolved ? Incident::where('status_id', $resolved)->count() : 0,
        ]);
    }

    public function company(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->name;
        if ($role !== 'jefe_empresa') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $statuses = IncidentStatus::pluck('id', 'name');

        return response()->json([
            'employees' => User::where('company_id', $user->company_id)->count(),
            'incidents' => Incident::where('company_id', $user->company_id)->count(),
            'open' => $statuses->has('abierta') ? Incident::where('company_id', $user->company_id)->where('status_id', $statuses['abierta'])->count() : 0,
            'in_progress' => $statuses->has('en_progreso') ? Incident::where('company_id', $user->company_id)->where('status_id', $statuses['en_progreso'])->count() : 0,
            'resolved' => $statuses->has('resuelta') ? Incident::where('company_id', $user->company_id)->where('status_id', $statuses['resuelta'])->count() : 0,
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
}
