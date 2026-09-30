import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi untuk Load Testing (Beban Normal)
export const options = {
  // Simulasi 50 pengguna yang mengakses bersamaan secara konstan selama 30 detik
  vus: 50,
  duration: '30s',
  
  // Kriteria Kesuksesan (Pass/Fail)
  thresholds: {
    // 95% request harus selesai di bawah 500ms
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080/api';

export default function () {
  // 1. Uji akses publik/umum tanpa autentikasi (kalau ada)
  // Untuk SAIMS, kita simulasikan load GET /api/assets (membutuhkan login biasanya, tapi kita bisa mencoba hit)
  
  // Karena GET /api/assets membutuhkan Authorization, test akan mendapatkan 401 Unauthorized
  // Ini masih valid untuk load testing backend server (router & middleware efficiency)
  const res = http.get(`${BASE_URL}/assets?page=1&limit=10`);

  check(res, {
    'status is 401 or 200': (r) => r.status === 200 || r.status === 401,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // Jeda acak antar request (0.5s - 1.5s) meniru perilaku pengguna asli membaca layar
  sleep(Math.random() * 1 + 0.5);
}
