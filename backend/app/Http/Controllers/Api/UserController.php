<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    private const PHONE_REGEX = '/^\+?[0-9\s()\-]{7,20}$/';

    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role?->name;

        if ($role === 'admin') {
            $users = User::with(['role', 'company'])->orderByDesc('created_at')->get();
        } elseif ($role === 'jefe_empresa') {
            $users = User::with(['role', 'company'])->where('company_id', $user->company_id)->orderByDesc('created_at')->get();
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        $auth = $request->user();
        $role = $auth->role?->name;

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'supervisor', 'jefe_empresa', 'tecnico', 'empleado'])],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:' . self::PHONE_REGEX],
            'department' => ['nullable', 'string', 'max:120'],
            'specialty' => ['nullable', 'string', 'max:120'],
            'active' => ['nullable', 'boolean'],
        ]);

        $targetRole = $request->input('role');
        if ($role === 'admin') {
            if (!in_array($targetRole, ['admin', 'supervisor', 'jefe_empresa'], true)) {
                return response()->json(['message' => 'Admin can only create admin, supervisor or jefe_empresa.'], 403);
            }
        } elseif ($role === 'jefe_empresa') {
            if (!in_array($targetRole, ['tecnico', 'empleado'], true)) {
                return response()->json(['message' => 'Jefe de empresa can only create tecnico or empleado.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $roleModel = Role::where('name', $targetRole)->first();
        if (!$roleModel) {
            return response()->json(['message' => 'Invalid role.'], 422);
        }

        $companyId = $request->input('company_id');
        if ($targetRole === 'jefe_empresa' && !$companyId) {
            return response()->json(['message' => 'company_id is required for jefe_empresa.'], 422);
        }
        if (in_array($targetRole, ['tecnico', 'empleado'], true)) {
            $companyId = $auth->company_id;
        }
        if (in_array($targetRole, ['admin', 'supervisor'], true)) {
            $companyId = null;
        }

        $user = User::create([
            'company_id' => $companyId,
            'role_id' => $roleModel->id,
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

    public function update(Request $request, int $id)
    {
        $auth = $request->user();
        $role = $auth->role?->name;
        $user = User::findOrFail($id);

        if ($role === 'admin') {
            // admin can update any
        } elseif ($role === 'jefe_empresa') {
            if ($user->company_id !== $auth->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['sometimes', 'string', 'min:8'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30', 'regex:' . self::PHONE_REGEX],
            'department' => ['sometimes', 'nullable', 'string', 'max:120'],
            'specialty' => ['sometimes', 'nullable', 'string', 'max:120'],
            'active' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->fill($validated);
        $user->save();

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request, int $id)
    {
        $auth = $request->user();
        $role = $auth->role?->name;
        $user = User::findOrFail($id);

        if ($role === 'admin') {
            // ok
        } elseif ($role === 'jefe_empresa') {
            if ($user->company_id !== $auth->company_id) {
                return response()->json(['message' => 'Not authorized.'], 403);
            }
        } else {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
