import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { uploadFile } from "./minio.service";
import { localDayjs } from "../utils/date";

const formatTanggal = (date: string | Date): string =>
  localDayjs(date).toDate().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const toBase64DataUri = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
};

const buildTabelMahasiswaRows = (anggota: any[]): string => {
  const programStudiSet = new Set<string>(anggota.map((m) => m.program_studi));
  const isSameProdi = programStudiSet.size === 1;

  return anggota
    .map((m, idx) => {
      const prodiCell =
        idx === 0
          ? `<td class="prodi" rowspan="${anggota.length}" style="vertical-align: middle; text-align: center">${isSameProdi ? anggota[0].program_studi : m.program_studi}</td>`
          : "";
      return `<tr>
        <td class="no">${idx + 1}</td>
        <td>${m.nama_lengkap}</td>
        <td class="nim">${m.nim_nisn}</td>
        ${prodiCell}
      </tr>`;
    })
    .join("\n");
};

export const generateSuratBalasan = async (data: any, jenis: "diterima" | "ditolak", nomorSurat: string): Promise<string> => {
  const templateDir = path.join(__dirname, `../template_surat/surat_balasan_${jenis}`);
  const templatePath = path.join(templateDir, `surat_balasan_${jenis}.html`);
  const imgDir = path.join(templateDir, `surat_balasan_${jenis}_files`);

  let html = fs.readFileSync(templatePath, "utf-8");

  const tanggalSuratPengantar = formatTanggal(data.tanggal_surat_pengantar);
  const tglMasuk = formatTanggal(data.tanggal_masuk);
  const tglKeluar = formatTanggal(data.tanggal_keluar);
  const tanggalSurat = formatTanggal(localDayjs().toDate());

  const isSekolah = data.anggota?.[0]?.jenjang_pendidikan === "sekolah";
  const labelIdentitas = isSekolah ? "NISN" : "NIM";

  html = html
    .replace("{{IMAGE_KOP}}", toBase64DataUri(path.join(imgDir, "image001.png")))
    .replace("{{IMAGE_STEMPEL}}", toBase64DataUri(path.join(imgDir, "image002.jpg")))
    .replace("{{IMAGE_TTD}}", toBase64DataUri(path.join(imgDir, "image003.png")))
    .replace("{{NOMOR_SURAT}}", nomorSurat)
    .replace("{{NAMA_PENERBIT_SURAT}}", data.nama_penerbit_surat || "Bapak/Ibu Pimpinan")
    .replace("{{NOMOR_SURAT_PENGANTAR}}", data.nomor_surat_pengantar || "-")
    .replace("{{TANGGAL_SURAT_PENGANTAR}}", tanggalSuratPengantar)
    .replace("{{PERIHAL_SURAT}}", data.perihal_surat || "Surat Permohonan Kerja Praktek")
    .replace("{{TABEL_MAHASISWA_ROWS}}", buildTabelMahasiswaRows(data.anggota))
    .replace("{{TANGGAL_MASUK}}", tglMasuk)
    .replace("{{TANGGAL_KELUAR}}", tglKeluar)
    .replace("{{KOTA_TANGGAL}}", `Bandar Lampung, ${tanggalSurat}`)
    .replace(/\{\{LABEL_IDENTITAS\}\}/g, labelIdentitas);

  if (jenis === "ditolak") {
    html = html.replace("{{ALASAN_TOLAK}}", data.alasan_tolak || "kuota peserta magang penuh");
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return await uploadFile(Buffer.from(pdfBuffer), `surat_balasan_${jenis}.pdf`, "application/pdf", "dokumen");
  } finally {
    await browser.close();
  }
};

export const generateSertifikat = async (dataPeserta: any, dataNilai: any, nomorSertifikat: string): Promise<string> => {
  const templatePath = path.join(__dirname, "../template_surat/sertifikat/sertifikat.html");

  let html = fs.readFileSync(templatePath, "utf-8");

  const tglMasuk = formatTanggal(dataPeserta.tanggal_masuk);
  const tglKeluar = formatTanggal(dataPeserta.tanggal_keluar);

  const kriteriaNilai = (dataNilai.items || []).map((item: any) => ({
    label: item.nama_kriteria || "Kriteria",
    value: Number(item.nilai),
  }));

  const catatanStr = dataNilai.catatan ? String(dataNilai.catatan).trim() : "";
  const isCatatanValid = catatanStr.length > 0 && catatanStr !== "<p></p>" && catatanStr !== "<br>" && catatanStr !== "<p><br></p>";

  const pages: any[][] = [];
  let currentIndex = 0;
  const totalItems = kriteriaNilai.length;

  if (totalItems === 0) {
    pages.push([]);
  } else {
    while (currentIndex < totalItems) {
      const remaining = totalItems - currentIndex;
      let pageSize: number;

      if (!isCatatanValid) {
        pageSize = Math.min(remaining, 7);
      } else {
        if (remaining <= 5) {
          pageSize = remaining;
        } else if (remaining === 6 || remaining === 7) {
          pageSize = 5;
        } else {
          pageSize = 7;
        }
      }

      pages.push(kriteriaNilai.slice(currentIndex, currentIndex + pageSize));
      currentIndex += pageSize;
    }
  }

  const isSekolah = dataPeserta.jenjang_pendidikan === "sekolah";
  const labelIdentitas = isSekolah ? "NISN" : "NIM";

  let accumulatedIndex = 0;
  const transcriptPagesHtml = pages
    .map((pageItems, pageIndex) => {
      const isLastPage = pageIndex === pages.length - 1;
      const startIndex = accumulatedIndex;
      accumulatedIndex += pageItems.length;

      const rowsHtml = pageItems
        .map(
          (k: { label: string; value: number }, idx: number) => `<tr>
              <td class="no">${startIndex + idx + 1}</td>
              <td>${k.label}</td>
              <td class="nilai">${k.value}</td>
            </tr>`
        )
        .join("\n");

      const footerHtml = isLastPage
        ? `
          <tfoot>
            <tr class="total-row">
              <td class="no"></td>
              <td>TOTAL NILAI AKHIR</td>
              <td class="nilai">${dataNilai.nilai_akhir}</td>
            </tr>
          </tfoot>
    `
        : "";

      const catatanHtml =
        isLastPage && isCatatanValid
          ? `
        <div class="catatan-box">
          <div class="catatan-label">Catatan dari Pembimbing</div>
          <div class="catatan-text">${dataNilai.catatan}</div>
        </div>
    `
          : "";

      return `
    <div class="page">
      <div class="corner tl">
        <img src="sertifikat_files/image006.png" alt="corner top left" />
      </div>
      <div class="corner br">
        <img src="sertifikat_files/image007.png" alt="corner bottom right" />
      </div>

      <div class="decoration bl">
        <img src="sertifikat_files/image005.png" alt="corner bottom left" />
      </div>
      <div class="decoration bl-above">
        <img src="sertifikat_files/image004.png" alt="decoration left middle" />
      </div>
      <div class="decoration tr">
        <img src="sertifikat_files/image003_decor.png" alt="corner top right below logo" />
      </div>
      <div class="decoration tr-below">
        <img src="sertifikat_files/image012.png" alt="decoration right middle" />
      </div>

      <div class="brandmark"><img src="sertifikat_files/microdata-logo.webp" alt="logo" /></div>

      <div class="content">
        <div class="tr-title">TRANSKIP</div>
        <div class="tr-subtitle">N I L A I &nbsp; M A G A N G</div>
        <div class="tr-pageflag">Halaman ${pageIndex + 1} dari ${pages.length}</div>

        <div class="tr-meta">
          <div class="m-row"><span class="m-label">Nama</span><span>:</span><span class="m-value">${dataPeserta.nama_lengkap}</span></div>
          <div class="m-row"><span class="m-label">${labelIdentitas}</span><span>:</span><span class="m-value">${dataPeserta.nim_nisn}</span></div>
          <div class="m-row"><span class="m-label">Institusi</span><span>:</span><span class="m-value">${dataPeserta.institusi}</span></div>
        </div>

        <table class="score-table">
          <thead>
            <tr>
              <th style="width: 70px" class="center">NO</th>
              <th>KRITERIA PENILAIAN</th>
              <th class="center" style="width: 180px">NILAI</th>
            </tr>
          </thead>
          <tbody>
${rowsHtml}
          </tbody>
${footerHtml}
        </table>
${catatanHtml}
      </div>
    </div>`;
    })
    .join("\n");

  html = html
    .replace("{{NOMOR_SERTIFIKAT}}", nomorSertifikat)
    .replace(/\{\{NAMA_PESERTA\}\}/g, dataPeserta.nama_lengkap)
    .replace(/\{\{INSTITUSI\}\}/g, dataPeserta.institusi)
    .replace(/\{\{TANGGAL_MASUK\}\}/g, tglMasuk)
    .replace(/\{\{TANGGAL_KELUAR\}\}/g, tglKeluar)
    .replace("{{TRANSCRIPT_PAGES}}", transcriptPagesHtml)
    .replace(/"sertifikat_files\/microdata-logo.webp"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/microdata-logo.webp"))}"`)
    .replace(/"sertifikat_files\/image003.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image003.png"))}"`)
    .replace(/"sertifikat_files\/image005.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image005.png"))}"`)
    .replace(/"sertifikat_files\/image006.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image006.png"))}"`)
    .replace(/"sertifikat_files\/image007.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image007.png"))}"`)
    .replace(/"sertifikat_files\/image003_decor.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image003_decor.png"))}"`)
    .replace(/"sertifikat_files\/image004.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image004.png"))}"`)
    .replace(/"sertifikat_files\/image012.png"/g, `"${toBase64DataUri(path.join(__dirname, "../template_surat/sertifikat/sertifikat_files/image012.png"))}"`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return await uploadFile(Buffer.from(pdfBuffer), `sertifikat_${dataPeserta.nama_lengkap.replace(/\\s+/g, "_")}.pdf`, "application/pdf", "sertifikat");
  } finally {
    await browser.close();
  }
};
