<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->user()->role?->name;
        if (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $companies = Company::orderByDesc('created_at')->get();

        return response()->json(['companies' => $companies]);
    }

    public function store(Request $request)
    {
        $role = $request->user()->role?->name;
        if ($role !== 'admin') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'cif' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:150', 'unique:companies,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $company = Company::create([
            'name' => $validated['name'],
            'cif' => $validated['cif'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json(['company' => $company], 201);
    }

    public function update(Request $request, int $id)
    {
        $role = $request->user()->role?->name;
        if ($role !== 'admin') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'cif' => ['sometimes', 'nullable', 'string', 'max:50'],
            'email' => ['sometimes', 'nullable', 'email', 'max:150', Rule::unique('companies', 'email')->ignore($company->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $company->fill($validated);
        $company->save();

        return response()->json(['company' => $company]);
    }
}
