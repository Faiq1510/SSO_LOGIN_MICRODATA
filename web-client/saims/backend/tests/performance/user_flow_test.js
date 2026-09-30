import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Simulasi 50 staf yang sedang menggunakan SAIMS bersamaan
  vus: 50,
  duration: '30s',
  thresholds: {
    // 95% request secara keseluruhan harus selesai di bawah 1 detik (1000ms)
    // Proses login dengan algoritma hashing bcrypt biasanya memakan CPU yang tinggi
    http_req_duration: ['p(95)<1000'], 
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080/api';

export default function () {
  // 1. SKENARIO LOGIN
  const loginPayload = JSON.stringify({
    email: 'staff@saims.com',
    password: 'password123'
  });
  
  const loginParams = {
    headers: { 'Content-Type': 'application/json' },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
  
  // Periksa apakah server merespon (entah itu 200 OK atau 401 jika user tidak ada)
  check(loginRes, {
    'login respons berhasil atau ditolak dg benar (200/401)': (r) => r.status === 200 || r.status === 401,
  });

  // Ekstrak token jika login berhasil (Opsional, untuk antisipasi jika DB kosong)
  let token = '';
  if (loginRes.status === 200) {
    try {
      token = loginRes.json('token');
    } catch(e) {}
  }

  // Jeda membaca (think time)
  sleep(Math.random() * 1 + 0.5);

  // 2. SKENARIO MELIHAT ASET (Menggunakan Token jika ada)
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  
  const assetRes = http.get(`${BASE_URL}/assets?page=1&limit=10`, authParams);
  check(assetRes, {
    'melihat aset (200/401)': (r) => r.status === 200 || r.status === 401,
  });

  sleep(Math.random() * 1 + 0.5);

  // 3. SKENARIO MEMINJAM ASET
  // Asumsikan aset dengan ID "123" atau apapun
  const borrowPayload = JSON.stringify({
    asset_id: "e44d567c-9b8e-4a12-88f2-39c47e85c123", // UUID dummy
    start_date: "2026-07-10T08:00:00Z",
    end_date: "2026-07-11T17:00:00Z",
    reason: "Load testing simulasi peminjaman massal",
  });

  const borrowRes = http.post(`${BASE_URL}/borrowings`, borrowPayload, authParams);
  check(borrowRes, {
    'respons peminjaman (201/400/401/404)': (r) => [201, 400, 401, 404, 409].includes(r.status),
  });

  sleep(Math.random() * 1 + 0.5);
}
