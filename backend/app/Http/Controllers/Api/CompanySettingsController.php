<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanySettingsController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $role = $user->role ? $user->role->name : null;

        if (!in_array($role, ['jefe_empresa', 'tecnico', 'empleado'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $settings = CompanySetting::firstOrCreate(
            ['company_id' => $user->company_id],
            [
                'primary_color' => '#2D61E5',
                'secondary_color' => '#7C3AED',
                'assignment_mode' => 'manual',
                'categories' => ['Hardware', 'Software', 'Red', 'Acceso', 'Otros'],
                'priorities' => ['Baja', 'Media', 'Alta', 'Crítica'],
                'departments' => [],
                'specialties' => [],
            ]
        );

        return response()->json(['settings' => $settings]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $role = $user->role ? $user->role->name : null;

        if ($role !== 'jefe_empresa') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'primary_color' => ['nullable', 'string', 'max:20'],
            'secondary_color' => ['nullable', 'string', 'max:20'],
            'logo' => ['nullable', 'string', 'max:255'],
            'system_name' => ['nullable', 'string', 'max:150'],
            'favicon' => ['nullable', 'string', 'max:255'],
            'assignment_mode' => ['nullable', Rule::in(['manual', 'auto', 'specialty'])],
            'categories' => ['nullable', 'array'],
            'priorities' => ['nullable', 'array'],
            'departments' => ['nullable', 'array'],
            'specialties' => ['nullable', 'array'],
        ]);

        $settings = CompanySetting::firstOrCreate(['company_id' => $user->company_id]);
        $settings->fill($validated);
        $settings->save();

        return response()->json(['settings' => $settings]);
    }
}
