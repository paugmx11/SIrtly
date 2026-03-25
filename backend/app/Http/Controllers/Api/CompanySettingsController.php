<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'primary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'logo' => ['nullable', 'string', 'max:255'],
            'logo_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'system_name' => ['nullable', 'string', 'max:150'],
            'favicon' => ['nullable', 'string', 'max:255'],
            'favicon_file' => ['nullable', 'file', 'mimes:png,ico,svg,webp', 'max:512'],
            'assignment_mode' => ['nullable', Rule::in(['manual', 'auto', 'specialty'])],
            'categories' => ['nullable', 'array'],
            'priorities' => ['nullable', 'array'],
            'departments' => ['nullable', 'array'],
            'specialties' => ['nullable', 'array'],
        ]);

        $settings = CompanySetting::firstOrCreate(['company_id' => $user->company_id]);

        foreach (['categories', 'priorities', 'departments', 'specialties'] as $field) {
            if (array_key_exists($field, $validated)) {
                $validated[$field] = collect($validated[$field])
                    ->map(fn ($value) => trim((string) $value))
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        if ($request->hasFile('logo_file')) {
            if ($settings->logo && str_starts_with($settings->logo, 'branding/')) {
                Storage::disk('public')->delete($settings->logo);
            }
            $validated['logo'] = $request->file('logo_file')->store('branding/logos', 'public');
        }

        if ($request->hasFile('favicon_file')) {
            if ($settings->favicon && str_starts_with($settings->favicon, 'branding/')) {
                Storage::disk('public')->delete($settings->favicon);
            }
            $validated['favicon'] = $request->file('favicon_file')->store('branding/favicons', 'public');
        }

        unset($validated['logo_file'], $validated['favicon_file']);
        $settings->fill($validated);
        $settings->save();

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => $settings->fresh(),
        ]);
    }
}
