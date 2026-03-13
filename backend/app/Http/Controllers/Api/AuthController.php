<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function registerCompany(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $authRoleName = $authUser->role ? $authUser->role->name : null;
        if ($authRoleName !== 'admin') {
            return response()->json(['message' => 'Only admin can create companies.'], 403);
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

    public function registerUser(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'supervisor', 'jefe_empresa', 'tecnico', 'empleado'])],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'department' => ['nullable', 'string', 'max:120'],
            'specialty' => ['nullable', 'string', 'max:120'],
            'active' => ['nullable', 'boolean'],
        ]);

        $authUser = $request->user();
        if (!$authUser) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $authRoleName = $authUser->role ? $authUser->role->name : null;
        $requestedRole = $request->input('role');

        $canAdminCreate = in_array($authRoleName, ['admin'], true);
        $canBossCreate = in_array($authRoleName, ['jefe_empresa'], true);

        if ($canAdminCreate) {
            if (!in_array($requestedRole, ['admin', 'supervisor', 'jefe_empresa'], true)) {
                return response()->json(['message' => 'Admin can only create admin, supervisor or jefe_empresa.'], 403);
            }
        } elseif ($canBossCreate) {
            if (!in_array($requestedRole, ['tecnico', 'empleado'], true)) {
                return response()->json(['message' => 'Jefe de empresa can only create tecnico or empleado.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized to create users.'], 403);
        }

        $role = Role::where('name', $requestedRole)->first();
        if (!$role) {
            return response()->json(['message' => 'Invalid role.'], 422);
        }

        $companyId = $request->input('company_id');
        if (in_array($requestedRole, ['jefe_empresa'], true)) {
            if (!$companyId) {
                return response()->json(['message' => 'company_id is required for jefe_empresa.'], 422);
            }
        }

        if (in_array($requestedRole, ['tecnico', 'empleado'], true)) {
            $companyId = $authUser->company_id;
            if (!$companyId) {
                return response()->json(['message' => 'Jefe de empresa must belong to a company.'], 422);
            }
        }

        if (in_array($requestedRole, ['admin', 'supervisor'], true)) {
            $companyId = null;
        }

        $user = User::create([
            'company_id' => $companyId,
            'role_id' => $role->id,
            'name' => $request->input('name'),
            'last_name' => $request->input('last_name'),
            'email' => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'phone' => $request->input('phone'),
            'department' => $request->input('department'),
            'specialty' => $request->input('specialty'),
            'active' => $request->boolean('active', true),
        ]);

        return response()->json(['user' => $user], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->active) {
            return response()->json(['message' => 'User inactive.'], 403);
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }
}
