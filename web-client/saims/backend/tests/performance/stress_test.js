import http from 'k6/http';
import { check, sleep } from 'k6';

// Konfigurasi untuk Stress Testing (Beban Ekstrim)
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up ke 50 user
    { duration: '30s', target: 100 }, // Ramp-up ke 100 user
    { duration: '1m', target: 200 },  // Spike (lonjakan) ke 200 user dan tahan selama 1 menit
    { duration: '30s', target: 50 },  // Scale down perlahan
    { duration: '10s', target: 0 },   // Recovery phase
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // P95 mungkin lebih lambat saat di-stress, max 1 detik
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:8080/api';

export default function () {
  const res = http.get(`${BASE_URL}/assets?page=1&limit=10`);

  check(res, {
    'status is 401 or 200': (r) => r.status === 200 || r.status === 401,
  });

  // Jeda sangat singkat (0.1s - 0.3s) meniru trafik padat tanpa jeda baca lama
  sleep(Math.random() * 0.2 + 0.1);
}
