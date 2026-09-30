# Frontend Architecture & Feature Organization (`docs/frontend/ARCHITECTURE.md`)

Frontend SAIMS dikembangkan menggunakan **Next.js 16 (App Router)** dengan **React 19**, **Tailwind CSS v4**, dan **TypeScript** berbasis arsitektur modular berorientasi fitur (*feature-based folder structure*).

---

## Directory Structure

```text
frontend/
├── src/
│ ├── app/ # Next.js 16 App Router Pages & Layouts
│ │ └── (dashboard)/ # Grouping rute ber-sidebar (inventory, borrowings, maintenance, approval, audit-logs, users, profile)
│ ├── components/ # Komponen UI dikelompokkan per fitur
│ │ ├── auth/ # Form login & 2FA OTP
│ │ ├── dashboard/ # Widgets & visualisasi statistik
│ │ ├── inventory/ # Tabel aset, Form tambah/edit, Recycle bin
│ │ ├── layout/ # Sidebar, Header, Navbar, ThemeToggle
│ │ ├── maintenance/ # Form jadwal perbaikan & Modal Invoice PDF
│ │ ├── ui/ # Design system primitives (Button, Modal, Input, Badge)
│ │ └── users/ # Manajemen pengguna (Admin)
│ ├── hooks/ # Custom React Hooks
│ ├── lib/ # Formatters, helpers, & Axios instance
│ └── types.ts # Interface & Tipe TypeScript terpusat
├── tests/ # Jest & Playwright Test Suites
└── public/ # Asset statis (Logo, Icon)
```

---

## Form Validation Strategy (Zod + React Hook Form)

Semua form input (seperti form tambah/edit aset, login, & jadwal maintenance) diverifikasi secara ketat menggunakan **Zod Schema** dan **React Hook Form**:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const assetSchema = z.object({
 name: z.string().min(3, "Nama aset minimal 3 karakter"),
 category: z.string().min(1, "Kategori wajib dipilih"),
 quantity: z.number().min(1, "Jumlah minimal 1"),
});
```

---

## Responsive Layout & Table Rules

1. **Table Width (100%)**: Tabel data utama diberikan lebar 100% penuh.
2. **Form Inputs in Modal Pop-up**: Formulir input tambah/edit tidak diletakkan bersebelahan (*side-by-side*) dengan tabel utama, melainkan di dalam **Modal Pop-up** agar tabel memiliki ruang horizontal optimal.
3. **Text Overflow Handling**: Bebas teks panjang/catatan dipotong dengan `truncate` / `line-clamp-2` dan dapat dibaca penuh melalui modal/tooltip.
