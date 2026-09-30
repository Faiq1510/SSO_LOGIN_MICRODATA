<?php

namespace App\Http\Controllers;

use App\Models\MasterStandarProgress;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MasterStandarProgressController extends Controller
{
    public function index()
    {
        $masters = MasterStandarProgress::withCount(['matrixProgress', 'units'])->get();

        return Inertia::render('StandarProgress/MasterIndex', [
            'masters' => $masters,
            'canEdit' => auth()->user()?->hasRole('Super Admin') ?? false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_standar' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        MasterStandarProgress::create($validated);

        return redirect()->route('standar.master.index')->with('success', 'Master Standar berhasil ditambahkan.');
    }

    public function update(Request $request, MasterStandarProgress $master)
    {
        $validated = $request->validate([
            'nama_standar' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
        ]);

        $master->update($validated);

        return redirect()->route('standar.master.index')->with('success', 'Master Standar berhasil diperbarui.');
    }

    public function destroy(MasterStandarProgress $master)
    {
        if ($master->units()->count() > 0) {
            return redirect()->route('standar.master.index')->with('error', 'Tidak dapat menghapus standar yang sedang digunakan oleh unit.');
        }

        // Delete its details and matrices
        foreach ($master->matrixProgress as $matrix) {
            $matrix->details()->delete();
        }
        $master->matrixProgress()->delete();
        $master->delete();

        return redirect()->route('standar.master.index')->with('success', 'Master Standar berhasil dihapus.');
    }
}
