---
name: clean-dev
description: Guidelines and workflow for grounded, minimal, and clean development without hallucinations or scope creep across the Microdata SSO Platform.
---

# Clean Dev & Grounded Development Skill

Skill ini memandu agen untuk bekerja secara ketat, terverifikasi, dan bersih di repositori **Microdata SSO Platform**.

## Prinsip Kerja

1. **Grounded / Anti-Halusinasi**:
   - Selalu periksa file sumber riil menggunakan tool baca file sebelum melakukan modifikasi atau menyimpulkan sesuatu.
   - Jangan berasumsi bahwa suatu method, skema tabel, atau env var tersedia tanpa memverifikasi sumbernya.
   - Cek `package.json`, `composer.json`, atau `go.mod` sebelum melakukan import modul.

2. **Strict Scope (Anti-Bloat)**:
   - Selesaikan tepat apa yang diminta, tanpa menambah fitur ekstra yang tidak diinstruksikan.
   - Jangan memasang library baru jika permasalahan bisa diselesaikan dengan fungsi standar yang sudah tersedia.
   - Jangan menyentuh atau melakukan refactoring pada file di luar area tugas.

3. **Clean Code & Cleanup**:
   - Pastikan tidak ada fungsi, variabel, atau import yang unused.
   - Hapus semua print statement / `console.log` debug sementara.
   - Bersihkan script scratch / temporary setelah selesai.

## Verifikasi per Sub-Proyek

- **SSO Backend (`backend/`)**:
  - Validasi sintaks Node.js.
  - Periksa query database terhadap file migrasi di `backend/migrations/`.
- **SSO Frontend (`frontend/`)**:
  - Pastikan styling dan script konsisten dengan PWA IdP.
- **Microintern (`web-client/microintern/`)**:
  - Patuhi `web-client/microintern/AGENTS.md`.
  - Jangan gunakan `npm run dev` untuk verifikasi; gunakan `npm run build` di folder frontend.
- **CPC (`web-client/cpc/`)**:
  - Patuhi `web-client/cpc/AGENTS.md`.
  - Gunakan alur standar Laravel (Route -> Controller -> Request -> Model).
- **SAIMS (`web-client/saims/`)**:
  - Pastikan backend Go dapat dicompile (`go build`) dan frontend Next.js lolos typecheck.
