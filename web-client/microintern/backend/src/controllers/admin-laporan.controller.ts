import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import ExcelJS from "exceljs";
import puppeteer from "puppeteer";
import { getLocalDateString, localDayjs } from "../utils/date";
import { fetchPeserta, fetchPresensi, fetchNilai } from "../repositories/laporan.repository";

type ExportFormat = "csv" | "xlsx" | "pdf";
type ExportType = "peserta" | "presensi" | "nilai";

const escapeCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '"-"';
  return `"${String(value).split('"').join('""')}"`;
};

const toCsv = (title: string, headers: string[], rows: Record<string, string | number | null | undefined>[], columnKeys: string[]): string => {
  const metadata = `# Laporan: ${title}\n# Tanggal Export: ${localDayjs().toDate().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n# Jumlah Data: ${rows.length}\n`;
  const headerRow = headers.map((h) => `"${h}"`).join(",");
  const dataRows = rows.map((row) => columnKeys.map((key) => escapeCell(row[key])).join(","));
  return metadata + [headerRow, ...dataRows].join("\n");
};

async function buildXlsx(title: string, rows: Record<string, string | number | null | undefined>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PT. Microdata Indonesia";
  wb.created = localDayjs().toDate();
  const ws = wb.addWorksheet(title, { properties: { tabColor: { argb: "FFE05C00" } } });

  if (rows.length === 0) {
    ws.addRow(["Tidak ada data"]);
    return (await wb.xlsx.writeBuffer()) as Buffer;
  }

  const headers = Object.keys(rows[0]);

  ws.mergeCells(1, 1, 1, headers.length);
  const companyCell = ws.getCell(1, 1);
  companyCell.value = "PT. MICRODATA INDONESIA — SISTEM MANAJEMEN PKL";
  companyCell.font = { bold: true, size: 9, color: { argb: "FF475569" } };
  companyCell.alignment = { vertical: "middle", horizontal: "left" };
  companyCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  ws.getRow(1).height = 22;

  ws.mergeCells(2, 1, 2, headers.length);
  const titleCell = ws.getCell(2, 1);
  titleCell.value = title.toUpperCase();
  titleCell.font = { bold: true, size: 14, color: { argb: "FF0F172A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  ws.getRow(2).height = 30;

  ws.mergeCells(3, 1, 3, headers.length);
  const metaCell = ws.getCell(3, 1);
  metaCell.value = `Tanggal Ekspor: ${localDayjs().toDate().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}   |   Total Data: ${rows.length} Baris`;
  metaCell.font = { italic: true, size: 9, color: { argb: "FF64748B" } };
  metaCell.alignment = { vertical: "middle", horizontal: "left" };
  metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
  ws.getRow(3).height = 20;

  ws.addRow([]);
  const sepRow = ws.getRow(4);
  for (let c = 1; c <= headers.length; c++) {
    const sepCell = ws.getCell(4, c);
    sepCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE05C00" } };
  }
  sepRow.height = 4;

  ws.addRow(headers);
  const headerRow = ws.getRow(5);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF334155" } },
      bottom: { style: "thin", color: { argb: "FF334155" } },
      left: { style: "thin", color: { argb: "FF334155" } },
      right: { style: "thin", color: { argb: "FF334155" } },
    };
  });
  headerRow.height = 26;

  rows.forEach((row, idx) => {
    const dataRow = ws.addRow(headers.map((h) => row[h] ?? "-"));
    dataRow.eachCell((cell, colNum) => {
      const rawVal = row[headers[colNum - 1]];
      const isNumber = typeof rawVal === "number";
      cell.font = { color: { argb: "FF1E293B" }, size: 9 };
      cell.alignment = { vertical: "middle", horizontal: isNumber ? "center" : "left", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
    dataRow.height = 20;
  });

  ws.columns.forEach((col) => {
    let maxLen = 12;
    col.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 4) {
        const val = cell.value ? String(cell.value) : "";
        if (val.length > maxLen) maxLen = val.length;
      }
    });
    col.width = Math.min(maxLen + 4, 45);
  });

  ws.views = [{ state: "frozen", ySplit: 5 }];

  return (await wb.xlsx.writeBuffer()) as Buffer;
}

async function buildPdf(title: string, rows: Record<string, string | number | null | undefined>[]): Promise<Buffer> {
  const tanggalGenerate = localDayjs().toDate().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

  let tableHtml = "";
  if (rows.length === 0) {
    tableHtml = `<div class="empty-state">Tidak ada data untuk ditampilkan.</div>`;
  } else {
    const headers = Object.keys(rows[0]);
    const numericColumns = new Set<string>();
    rows.forEach((row) => {
      headers.forEach((h) => {
        if (typeof row[h] === "number") numericColumns.add(h);
      });
    });
    const theadCells = headers.map((h) => `<th class="${numericColumns.has(h) ? "col-num" : ""}">${h}</th>`).join("");
    const tbodyRows = rows
      .map((row, idx) => {
        const cells = headers
          .map((h) => {
            const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : "-";
            const isNum = numericColumns.has(h);
            return `<td class="${isNum ? "col-num" : ""}">${val}</td>`;
          })
          .join("");
        return `<tr class="${idx % 2 === 0 ? "even" : "odd"}">${cells}</tr>`;
      })
      .join("");
    tableHtml = `<table><thead><tr>${theadCells}</tr></thead><tbody>${tbodyRows}</tbody></table>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #ffffff;
            color: #0F172A;
            font-size: 9px;
            line-height: 1.4;
          }
          .doc-header {
            padding: 12px 16px 8px;
          }
          .doc-header-inner {
            background: #1E293B;
            border-left: 5px solid #E05C00;
            border-radius: 4px;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-left .company {
            font-size: 8px;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #94A3B8;
            margin-bottom: 2px;
          }
          .header-left .report-title {
            font-size: 16px;
            font-weight: 700;
            color: #FFFFFF;
            letter-spacing: -0.2px;
          }
          .header-right {
            text-align: right;
          }
          .meta-box {
            background: #334155;
            padding: 6px 12px;
            border-radius: 4px;
            color: #F8FAFC;
            font-size: 8px;
            line-height: 1.5;
          }
          .meta-box strong {
            color: #FFFFFF;
          }
          .content {
            padding: 4px 16px 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 4px;
          }
          th {
            background: #1E293B;
            color: #FFFFFF;
            font-weight: 600;
            font-size: 8px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            padding: 8px 10px;
            text-align: left;
            border: 1px solid #334155;
          }
          th.col-num { text-align: center; }
          td {
            padding: 7px 10px;
            border: 1px solid #E2E8F0;
            vertical-align: middle;
            color: #1E293B;
          }
          td.col-num { text-align: center; font-weight: 500; }
          tr.even td { background-color: #F8FAFC; }
          tr.odd td { background-color: #FFFFFF; }
          .empty-state {
            text-align: center;
            color: #64748B;
            padding: 32px;
            font-size: 10px;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <div class="doc-header-inner">
            <div class="header-left">
              <div class="company">PT. Microdata Indonesia &bull; Sistem Manajemen PKL</div>
              <div class="report-title">${title}</div>
            </div>
            <div class="header-right">
              <div class="meta-box">
                <div>Tanggal Ekspor: <strong>${tanggalGenerate}</strong></div>
                <div>Total Data: <strong>${rows.length} Baris</strong></div>
              </div>
            </div>
          </div>
        </div>
        <div class="content">
          ${tableHtml}
        </div>
      </body>
    </html>
  `;

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
      margin: { top: "10mm", right: "12mm", bottom: "14mm", left: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width:100%; font-size:8px; font-family:'Inter',sans-serif; color:#64748B; padding:0 16mm; display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#0F172A; font-weight:600;">PT. Microdata Indonesia</span>
          <span>Digenerate pada: ${tanggalGenerate}</span>
          <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
        </div>
      `,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export const getLaporanExport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden: Admin access only" });
    }

    const type = req.query.type as ExportType | undefined;
    const format = (req.query.format as ExportFormat | undefined) ?? "csv";
    const startDate = typeof req.query.startDate === "string" && req.query.startDate.trim() ? req.query.startDate.trim() : undefined;
    const endDate = typeof req.query.endDate === "string" && req.query.endDate.trim() ? req.query.endDate.trim() : undefined;

    if (!["peserta", "presensi", "nilai"].includes(type ?? "")) {
      return res.status(400).json({ status: "error", message: "Invalid export type. Must be 'peserta', 'presensi', or 'nilai'." });
    }

    if (!["csv", "xlsx", "pdf"].includes(format)) {
      return res.status(400).json({ status: "error", message: "Invalid format. Must be 'csv', 'xlsx', or 'pdf'." });
    }

    let rows: Record<string, string | number | null | undefined>[] = [];
    let titleMap: Record<ExportType, string> = {
      peserta: "Rekap Peserta PKL",
      presensi: "Rekap Kehadiran PKL",
      nilai: "Rekap Nilai PKL",
    };

    if (type === "peserta") rows = await fetchPeserta(startDate, endDate);
    else if (type === "presensi") rows = await fetchPresensi(startDate, endDate);
    else if (type === "nilai") rows = await fetchNilai(startDate, endDate);

    const title = titleMap[type!];
    const basename = `${type}-${getLocalDateString()}`;

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${basename}.csv"`);
      if (rows.length === 0) {
        return res.send("\uFEFF");
      }
      const headers = Object.keys(rows[0]);
      const csv = toCsv(title, headers, rows, headers);
      return res.send("\uFEFF" + csv);
    }

    if (format === "xlsx") {
      const buffer = await buildXlsx(title, rows);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${basename}.xlsx"`);
      return res.send(buffer);
    }

    if (format === "pdf") {
      const buffer = await buildPdf(title, rows);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${basename}.pdf"`);
      return res.send(buffer);
    }
  } catch (err) {
    next(err);
  }
};
