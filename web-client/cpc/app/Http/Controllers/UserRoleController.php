<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserMenuOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

/**
 * @OA\Tag(
 *     name="Admin - User Role",
 *     description="Manajemen user roles, status, dan menu override"
 * )
 */
class UserRoleController extends Controller
{
    private const ROLE_PRIORITY = [
        'Super Admin'    => 1,
        'Owner'          => 2,
        'Admin'          => 3,
        'Admin Keuangan' => 4,
    ];

    /**
     * @OA\Get(
     *     path="/user-role",
     *     tags={"Admin - User Role"},
     *     summary="Daftar user role",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="role", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="status", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Halaman daftar pengguna")
     * )
     */
    public function index(Request $request)
    {
        $currentUserId = $request->user()->id;

        $users = User::with(['roles', 'menuOverrides'])
            ->when($request->filled('role'), function ($q) use ($request) {
                $q->whereHas('roles', fn ($r) => $r->where('name', $request->input('role')));
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('is_active', $request->input('status') === 'aktif');
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%' . $request->input('search') . '%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('name', 'ILIKE', $term)
                        ->orWhere('username', 'ILIKE', $term)
                        ->orWhere('email', 'ILIKE', $term);
                });
            })
            ->orderBy('name')
            ->get()
            ->sortBy([
                fn ($a, $b) => (int) ($b->id === $currentUserId) <=> (int) ($a->id === $currentUserId),
                fn ($a, $b) => (self::ROLE_PRIORITY[$a->roles->pluck('name')->first()] ?? 99)
                    <=> (self::ROLE_PRIORITY[$b->roles->pluck('name')->first()] ?? 99),
                fn ($a, $b) => (int) $b->is_active <=> (int) $a->is_active,
                fn ($a, $b) => strcmp($a->name, $b->name),
            ])
            ->values();

        $userIds = $users->pluck('id')->all();

        $relatedUserIds = array_merge(
            DB::table('log_masuk_gudang')->whereIn('created_by', $userIds)->distinct()->pluck('created_by')->all(),
            DB::table('log_keluar_harian')->whereIn('created_by', $userIds)->distinct()->pluck('created_by')->all(),
            DB::table('progress_unit')->whereIn('updated_by', $userIds)->distinct()->pluck('updated_by')->all(),
        );

        $relatedUserIds = array_unique($relatedUserIds);

        $currentUserId = $request->user()->id;

        $users = $users->map(fn ($u) => [
            'id'            => $u->id,
            'nama'          => $u->name,
            'username'      => $u->username,
            'email'         => $u->email,
            'role'          => $u->roles->pluck('name')->first() ?? '-',
            'isActive'      => (bool) $u->is_active,
            'lastLogin'     => $u->last_login_at?->format('d M Y \\· H:i') ?? '—',
            'menuOverrides' => $u->menuOverrides->map(fn ($o) => [
                'menu_key' => $o->menu_key,
                'visible'  => $o->visible,
            ])->values()->toArray(),
            'canDelete'     => ! in_array($u->id, $relatedUserIds, true) && $u->id !== $currentUserId,
        ]);

        return Inertia::render('UserRole/Index', [
            'users'      => $users,
            'roles'      => Role::pluck('name'),
            'authUserId' => $request->user()->id,
            'filters'    => [
                'role'   => $request->input('role', ''),
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/user-role",
     *     tags={"Admin - User Role"},
     *     summary="Tambah user baru",
     *     security={{"sanctum": {}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah user dibuat")
     * )
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => ['required', 'string', 'max:255', 'unique:users,username'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8'],
            'role'      => ['required', 'string', 'exists:roles,name'],
            'is_active' => ['boolean'],
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'username'  => $data['username'],
            'email'     => $data['email'],
            'password'  => Hash::make($data['password']),
            'is_active' => $data['is_active'] ?? true,
        ]);

        $user->assignRole($data['role']);

        return back()->with('success', 'Pengaturan akses menu berhasil disimpan.');
    }

    /**
     * @OA\Put(
     *     path="/user-role/{user}",
     *     tags={"Admin - User Role"},
     *     summary="Update user",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
     *     @OA\Response(response=302, description="Redirect setelah user diperbarui")
     * )
     */
    public function update(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors([
                'general' => 'Anda tidak dapat mengedit akun Anda sendiri.'
            ]);
        }

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'username'  => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($user->id)
            ],
            'email'     => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id)
            ],
            'password'  => ['nullable', 'string', 'min:8'],
            'role'      => ['nullable', 'string', 'exists:roles,name'],
            'is_active' => ['boolean'],
        ]);

        $user->update([
            'name'      => $data['name'],
            'username'  => $data['username'],
            'email'     => $data['email'],
            'is_active' => $data['is_active'] ?? $user->is_active,
            ...(!empty($data['password'])
                ? ['password' => Hash::make($data['password'])]
                : []),
        ]);

        if (!empty($data['role'])) {
            $user->syncRoles($data['role']);
        }

        return back();
    }

    /**
     * @OA\Patch(
     *     path="/users/{user}/toggle",
     *     tags={"Admin - User Role"},
     *     summary="Toggle status user",
     *     security={{"sanctum": {}}},
     *     @OA\Parameter(name="user", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=302, description="Redirect setelah status user diubah")
     * )
     */
    public function toggleStatus(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->withErrors(['general' => 'Anda tidak dapat mengubah status akun Anda sendiri.']);
        }

        $user->update(['is_active' => ! $user->is_active]);
        return back();
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $hasRelatedData =
            DB::table('log_masuk_gudang')->where('created_by', $user->id)->exists() ||
            DB::table('log_keluar_harian')->where('created_by', $user->id)->exists() ||
            DB::table('progress_unit')->where('updated_by', $user->id)->exists();

        if ($hasRelatedData) {
            return back()->with('error', 'Akun tidak bisa dihapus karena sudah digunakan dalam transaksi atau progress.');
        }

        $user->delete();
        return back()->with('success', 'Akun berhasil dihapus.');
    }

    /**
     * Simpan override visibilitas menu untuk user tertentu.
     * Payload: { overrides: [{ menu_key: string, visible: bool }] }
     */
    public function updateMenuOverride(Request $request, User $user)
    {
        // Allow empty array (present) so user can reset all overrides to default
        $data = $request->validate([
            'overrides'            => ['present', 'array'],
            'overrides.*.menu_key' => ['string', 'max:100'],
            'overrides.*.visible'  => ['boolean'],
        ]);

        // Hapus semua override lama, ganti dengan yang baru
        $user->menuOverrides()->delete();

        foreach ($data['overrides'] as $override) {
            // Hanya simpan yang benar-benar menjadi override (bukan "default")
            UserMenuOverride::create([
                'user_id'  => $user->id,
                'menu_key' => $override['menu_key'],
                'visible'  => $override['visible'],
            ]);
        }

        return back();
    }
}