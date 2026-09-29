# TODO - Update Sistem Surat

## Task
1. Template khusus jenis surat (Surat Kuasa) + dropdown dinamis bisa tambah jenis surat
2. Kolom kode surat di form input surat keluar (dipakai untuk generate nomor otomatis)
3. Hide kolom: jenis_surat & perihal (datatable surat keluar), jenis_surat & no agenda (datatable surat masuk)

## Steps

- [ ] 1. Buat migration `create_jenis_surats_table`
- [ ] 2. Buat migration `add_kode_surat_to_surat_keluars_table`
- [ ] 3. Buat migration `add_data_khusus_to_surat_keluars_table`
- [ ] 4. Update `DatabaseSeeder.php` (data awal jenis surat)
- [ ] 5. Buat model `JenisSurat`
- [ ] 6. Update model `SuratKeluar` (fillable + cast)
- [ ] 7. Buat controller `JenisSuratController`
- [ ] 8. Update `SuratKeluarController` (create, store, update, generateNomorSurat)
- [ ] 9. Update `routes/web.php`
- [ ] 10. Update `resources/views/surat_keluar/create.blade.php`
- [ ] 11. Update `resources/views/surat_keluar/edit.blade.php`
- [ ] 12. Update `resources/views/surat_keluar/index.blade.php` (hide kolom)
- [ ] 13. Update `resources/views/surat_keluar/show.blade.php`
- [ ] 14. Update `resources/views/surat_keluar/pdf.blade.php` (template kuasa)
- [ ] 15. Update `resources/views/surat_keluar/preview.blade.php` (template kuasa)
- [ ] 16. Update `resources/views/surat_masuk/index.blade.php` (hide kolom)
- [ ] 17. Jalankan `php artisan migrate`
- [ ] 18. Jalankan seeder jenis surat

