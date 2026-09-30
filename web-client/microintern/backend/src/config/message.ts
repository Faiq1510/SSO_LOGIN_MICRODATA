export const getPenerimaanPklMessage = (namaLengkap: string, tanggalMulai: string, tanggalSelesai: string, suratBalasanUrl: string) => {
  return {
    subject: "Penerimaan Praktik Kerja Lapangan (PKL) - PT. Microdata Indonesia",
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <h2>Selamat, Pengajuan PKL Anda Diterima!</h2>
      <p>Halo <strong>${namaLengkap}</strong>,</p>
      <p>Kami dengan senang hati menginformasikan bahwa pengajuan Praktik Kerja Lapangan (PKL) Anda di PT. Microdata Indonesia telah <strong>Diterima</strong>.</p>
      <p><strong>Detail Periode:</strong></p>
      <ul>
        <li>Tanggal Mulai: ${tanggalMulai}</li>
        <li>Tanggal Selesai: ${tanggalSelesai}</li>
      </ul>
      <p>Surat balasan resmi penerimaan telah kami lampirkan dalam email ini. Anda juga dapat mengunduh surat tersebut kapan saja melalui tautan berikut:</p>
      <p><a href="${suratBalasanUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Unduh Surat Balasan</a></p>
      <p>Harap bersiap sebelum tanggal mulai kegiatan PKL Anda.</p>
      <p>Salam hangat,<br><strong>Tim HRD PT. Microdata Indonesia</strong></p>
    </div>`,
  };
};

export const getPenolakanPklMessage = (namaLengkap: string, alasanTolak: string, suratBalasanUrl: string) => {
  return {
    subject: "Informasi Pengajuan Praktik Kerja Lapangan (PKL) - PT. Microdata Indonesia",
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <h2>Informasi Pengajuan PKL</h2>
      <p>Halo <strong>${namaLengkap}</strong>,</p>
      <p>Terima kasih atas minat Anda untuk melaksanakan Praktik Kerja Lapangan (PKL) di PT. Microdata Indonesia.</p>
      <p>Setelah melakukan evaluasi terhadap berkas pengajuan Anda, dengan menyesal kami menginformasikan bahwa pengajuan Anda saat ini <strong>Belum Dapat Diterima</strong> dengan alasan berikut:</p>
      <blockquote style="background-color: #f8d7da; border-left: 5px solid #dc3545; padding: 10px; margin: 15px 0; color: #721c24;">
        ${alasanTolak}
      </blockquote>
      <p>Surat balasan resmi penolakan telah kami lampirkan dalam email ini. Anda juga dapat mengunduh surat tersebut melalui tautan berikut:</p>
      <p><a href="${suratBalasanUrl}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: #fff; text-decoration: none; border-radius: 5px;">Unduh Surat Balasan</a></p>
      <p>Kami mendoakan yang terbaik untuk kelancaran studi dan karir Anda di masa mendatang.</p>
      <p>Salam hangat,<br><strong>Tim HRD PT. Microdata Indonesia</strong></p>
    </div>`,
  };
};

export const getPenilaianPklMessage = (
  namaLengkap: string,
  nilaiAkhir: number,
  predikat: string,
  items: { nama: string; nilai: number }[],
  catatan: string | null,
  fileUrl: string
) => {
  return {
    subject: "Sertifikat dan Hasil Penilaian PKL - PT. Microdata Indonesia",
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <h2>Selamat, Anda Telah Menyelesaikan Kegiatan PKL!</h2>
      <p>Halo <strong>${namaLengkap}</strong>,</p>
      <p>Kami mengucapkan selamat atas keberhasilan Anda menyelesaikan seluruh rangkaian kegiatan Praktik Kerja Lapangan (PKL) di PT. Microdata Indonesia.</p>
      <p>Berikut adalah ringkasan hasil penilaian Anda:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 15px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kriteria</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Nilai</th>
        </tr>
        ${items
          .map(
            (item) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.nama}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.nilai}</td>
        </tr>
        `
          )
          .join("")}
        <tr style="font-weight: bold; background-color: #e9ecef;">
          <td style="border: 1px solid #ddd; padding: 8px;">Nilai Akhir (Predikat)</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${nilaiAkhir} (${predikat})</td>
        </tr>
      </table>
      ${catatan ? `<p><strong>Catatan Pembimbing:</strong> ${catatan}</p>` : ""}
      <p>Sertifikat PKL resmi Anda telah dilampirkan dalam email ini. Anda juga dapat mengunduh sertifikat tersebut melalui tautan berikut:</p>
      <p><a href="${fileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Unduh Sertifikat</a></p>
      <p>Terima kasih atas dedikasi dan kontribusi positif Anda selama masa PKL. Semoga sukses untuk studi dan karir Anda ke depan.</p>
      <p>Salam hangat,<br><strong>Tim HRD PT. Microdata Indonesia</strong></p>
    </div>`,
  };
};

export const getPembaruanPenilaianPklMessage = (
  namaLengkap: string,
  nilaiAkhir: number,
  predikat: string,
  items: { nama: string; nilai: number }[],
  catatan: string | null,
  fileUrl: string
) => {
  return {
    subject: "Pembaruan Sertifikat dan Penilaian PKL - PT. Microdata Indonesia",
    html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
      <h2>Pembaruan Hasil Penilaian dan Sertifikat PKL</h2>
      <p>Halo <strong>${namaLengkap}</strong>,</p>
      <p>Kami menginformasikan bahwa terdapat pembaruan pada hasil penilaian Praktik Kerja Lapangan (PKL) Anda di PT. Microdata Indonesia.</p>
      <p>Berikut adalah ringkasan hasil penilaian terbaru Anda:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 15px 0;">
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kriteria</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Nilai</th>
        </tr>
        ${items
          .map(
            (item) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${item.nama}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.nilai}</td>
        </tr>
        `
          )
          .join("")}
        <tr style="font-weight: bold; background-color: #e9ecef;">
          <td style="border: 1px solid #ddd; padding: 8px;">Nilai Akhir (Predikat)</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${nilaiAkhir} (${predikat})</td>
        </tr>
      </table>
      ${catatan ? `<p><strong>Catatan Pembimbing:</strong> ${catatan}</p>` : ""}
      <p>Sertifikat terbaru Anda telah dilampirkan dalam email ini. Anda juga dapat mengunduh sertifikat tersebut melalui tautan berikut:</p>
      <p><a href="${fileUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: #fff; text-decoration: none; border-radius: 5px;">Unduh Sertifikat</a></p>
      <p>Salam hangat,<br><strong>Tim HRD PT. Microdata Indonesia</strong></p>
    </div>`,
  };
};

export const getKonfirmasiPerubahanEmailMessage = (otp: string) => {
  return {
    subject: "Konfirmasi Perubahan Email - Sistem Informasi Manajemen Peserta PKL",
    html: `<h2>Perubahan Email</h2>
      <p>Halo,</p>
      <p>Anda menerima email ini karena ada permintaan untuk mengubah alamat email akun Anda ke email ini.</p>
      <p>Kode OTP Anda adalah: <strong>${otp}</strong></p>
      <p>Kode ini berlaku selama 1 jam.</p>`,
  };
};

export const getKonfirmasiEmailMessage = (otp: string) => {
  return {
    subject: "Konfirmasi Email - Sistem Informasi Manajemen Peserta PKL",
    html: `<h2>Konfirmasi Email</h2>
      <p>Halo,</p>
      <p>Kode OTP Anda untuk konfirmasi email adalah: <strong>${otp}</strong></p>
      <p>Kode ini berlaku selama 1 jam.</p>`,
  };
};

export const getResetPasswordMessage = (otp: string) => {
  return {
    subject: "Reset Password - Sistem Informasi Manajemen Peserta PKL",
    html: `<h2>Reset Password</h2>
      <p>Halo,</p>
      <p>Kode OTP Anda untuk reset password adalah: <strong>${otp}</strong></p>
      <p>Kode ini berlaku selama 1 jam.</p>`,
  };
};
