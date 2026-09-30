import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sistem Informasi Manajemen Peserta PKL API",
      version: "1.0.0",
      description:
        "Dokumentasi API resmi untuk Sistem Informasi Manajemen Peserta Praktik Kerja Lapangan (PKL) - mencakup Pendaftaran, Verifikasi, Presensi, Penilaian, Laporan, dan Pengaturan Sistem.",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["peserta", "admin"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        ProfilPeserta: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            nama_lengkap: { type: "string" },
            nim_nisn: { type: "string" },
            institusi: { type: "string" },
            program_studi: { type: "string" },
            cv_url: { type: "string", nullable: true },
            onboarding_status: { type: "string", enum: ["belum_mulai", "step_1_selesai", "selesai"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Pendaftaran: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            kelompok_id: { type: "string", format: "uuid" },
            tanggal_masuk: { type: "string", format: "date" },
            tanggal_keluar: { type: "string", format: "date" },
            surat_pengantar_url: { type: "string" },
            status: { type: "string", enum: ["menunggu", "aktif", "selesai", "ditolak"] },
            alasan_tolak: { type: "string", nullable: true },
            diproses_oleh: { type: "string", format: "uuid", nullable: true },
            diproses_pada: { type: "string", format: "date-time", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Presensi: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            tanggal: { type: "string", format: "date" },
            jam_masuk: { type: "string", format: "date-time", nullable: true },
            jam_keluar: { type: "string", format: "date-time", nullable: true },
            status: { type: "string", enum: ["hadir", "izin", "alpha"] },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Izin: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            tanggal: { type: "string", format: "date" },
            kategori: { type: "string" },
            alasan: { type: "string" },
            bukti_url: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        Penilaian: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            user_id: { type: "string", format: "uuid" },
            dinilai_oleh: { type: "string", format: "uuid" },
            disiplin: { type: "number", minimum: 0, maximum: 100 },
            kehadiran: { type: "number", minimum: 0, maximum: 100 },
            komunikasi: { type: "number", minimum: 0, maximum: 100 },
            kerja_sama: { type: "number", minimum: 0, maximum: 100 },
            tanggung_jawab: { type: "number", minimum: 0, maximum: 100 },
            inisiatif: { type: "number", minimum: 0, maximum: 100 },
            nilai_akhir: { type: "number" },
            catatan: { type: "string", nullable: true },
            sertifikat_url: { type: "string", nullable: true },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            message: { type: "string" },
            data: { type: "object", nullable: true },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "error" },
            message: { type: "string" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
