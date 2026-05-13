<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    private const PHONE_REGEX = '/^\+?[0-9\s()\-]{7,20}$/';
    private const CIF_REGEX = '/^[A-Za-z0-9\-]{5,20}$/';

    public function index(Request $request)
    {
        $role = $request->user()->role?->name;
        if (!in_array($role, ['admin', 'supervisor'], true)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Company::query()->orderByDesc('created_at');

        if (!empty($validated['search'])) {
            $search = trim((string) $validated['search']);
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'LIKE', '%' . $search . '%')
                    ->orWhere('cif', 'LIKE', '%' . $search . '%')
                    ->orWhere('email', 'LIKE', '%' . $search . '%')
                    ->orWhere('phone', 'LIKE', '%' . $search . '%');
            });
        }

        $limit = (int) ($validated['limit'] ?? 10);
        $companies = $query->paginate($limit)->appends($request->query());

        return response()->json([
            'companies' => $companies->items(),
            'pagination' => [
                'page' => $companies->currentPage(),
                'limit' => $companies->perPage(),
                'total' => $companies->total(),
                'lastPage' => $companies->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $role = $request->user()->role?->name;
        if ($role !== 'admin') {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'cif' => ['nullable', 'string', 'max:50', 'regex:' . self::CIF_REGEX],
            'email' => ['nullable', 'email', 'max:150', 'unique:companies,email'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:' . self::PHONE_REGEX],
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
            'cif' => ['sometimes', 'nullable', 'string', 'max:50', 'regex:' . self::CIF_REGEX],
            'email' => ['sometimes', 'nullable', 'email', 'max:150', Rule::unique('companies', 'email')->ignore($company->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:' . self::PHONE_REGEX],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $company->fill($validated);
        $company->save();

        return response()->json(['company' => $company]);
    }
}
