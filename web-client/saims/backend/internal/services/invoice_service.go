package services

import (
	"bytes"
	"fmt"
	"time"

	"github.com/jung-kurt/gofpdf"
	"saims-backend/internal/domain"
)

type InvoiceService interface {
	GenerateInvoicePDF(maintenances []*domain.Maintenance, adminName string) (*bytes.Buffer, error)
}

type invoiceService struct{}

func NewInvoiceService() InvoiceService {
	return &invoiceService{}
}

func (s *invoiceService) GenerateInvoicePDF(maintenances []*domain.Maintenance, adminName string) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Helper for format currency
	formatRupiah := func(amount float64) string {
		return fmt.Sprintf("Rp %.0f", amount)
	}

	invoiceNo := fmt.Sprintf("INV-%s-%d", time.Now().Format("20060102"), time.Now().UnixMilli()%10000)
	technicianName := "-"
	if len(maintenances) > 0 {
		technicianName = maintenances[0].TechnicianName
	}

	// 1. Header
	pdf.SetFont("Arial", "B", 20)
	pdf.SetTextColor(26, 54, 93) // #1a365d
	pdf.CellFormat(100, 10, "PT. MICRODATA INDONESIA", "", 0, "L", false, 0, "")
	
	pdf.SetFont("Arial", "", 24)
	pdf.SetTextColor(45, 55, 72) // #2d3748
	pdf.CellFormat(90, 10, "INVOICE", "", 1, "R", false, 0, "")
	
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(113, 128, 150) // #718096
	pdf.CellFormat(100, 5, "IT Maintenance & Solution Specialist", "", 0, "L", false, 0, "")
	
	pdf.SetTextColor(74, 85, 104) // #4a5568
	pdf.CellFormat(90, 5, "Nomor: " + invoiceNo, "", 1, "R", false, 0, "")
	
	pdf.Ln(15)

	// 2. Info Info
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(113, 128, 150)
	pdf.CellFormat(95, 5, "DITERBITKAN OLEH", "B", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, "TAGIHAN KEPADA", "B", 1, "L", false, 0, "")
	pdf.Ln(2)

	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(45, 55, 72)
	pdf.CellFormat(95, 5, "PT. Microdata Indonesia", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, technicianName, "", 1, "L", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	pdf.CellFormat(95, 5, "Jl. Endro Suratmin No.52D", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, "-", "", 1, "L", false, 0, "") // Teknisi Phone

	pdf.CellFormat(95, 5, "Bandar Lampung, Lampung, Indonesia", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, "", "", 1, "L", false, 0, "")
	
	pdf.CellFormat(95, 5, "Email: microdataindonesia@gmail.com", "", 1, "L", false, 0, "")
	pdf.Ln(8)

	// 3. Meta Tanggal
	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(113, 128, 150)
	pdf.CellFormat(130, 5, "", "", 0, "R", false, 0, "")
	pdf.CellFormat(30, 5, "Tanggal Invoice:", "", 0, "R", false, 0, "")
	pdf.SetFont("Arial", "B", 10)
	pdf.SetTextColor(45, 55, 72)
	pdf.CellFormat(30, 5, time.Now().Format("02 Jan 2006"), "", 1, "R", false, 0, "")
	pdf.Ln(5)

	// 4. Rincian Item (Table Header)
	pdf.SetFillColor(247, 250, 252) // #f7fafc
	pdf.SetDrawColor(237, 242, 247) // #edf2f7
	pdf.SetLineWidth(0.5)
	
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(74, 85, 104)
	
	pdf.CellFormat(10, 10, "NO", "B", 0, "C", true, 0, "")
	pdf.CellFormat(90, 10, "DESKRIPSI LAYANAN", "B", 0, "L", true, 0, "")
	pdf.CellFormat(50, 10, "CATATAN", "B", 0, "C", true, 0, "")
	pdf.CellFormat(40, 10, "TOTAL", "B", 1, "R", true, 0, "")

	// Table Body
	var totalCost float64 = 0
	pdf.SetFont("Arial", "", 9)
	
	for i, m := range maintenances {
		cost := 0.0
		if m.ActualCost != nil {
			cost = *m.ActualCost
		} else {
			cost = m.EstimatedCost
		}
		totalCost += cost
		
		yStart := pdf.GetY()
		
		// NO
		pdf.SetXY(10, yStart)
		pdf.SetTextColor(45, 55, 72)
		pdf.CellFormat(10, 8, fmt.Sprintf("%d", i+1), "", 0, "C", false, 0, "")
		
		// Deskripsi Layanan (Type + Asset)
		pdf.SetXY(20, yStart+2)
		pdf.SetFont("Arial", "B", 10)
		pdf.CellFormat(90, 5, m.Type + " - " + m.AssetName, "", 2, "L", false, 0, "")
		
		pdf.SetFont("Arial", "", 8)
		pdf.SetTextColor(113, 128, 150)
		
		descText := m.Notes
		if descText == "" {
			descText = "ID Aset: " + m.AssetID
		}
		pdf.MultiCell(90, 4, descText, "", "L", false)
		yDesc := pdf.GetY()
		
		// Catatan (Status)
		pdf.SetXY(110, yStart)
		pdf.SetTextColor(45, 55, 72)
		pdf.SetFont("Arial", "", 9)
		pdf.CellFormat(50, 8, m.Status, "", 0, "C", false, 0, "")
		
		// Total
		pdf.SetXY(160, yStart)
		pdf.SetFont("Arial", "B", 9)
		pdf.CellFormat(40, 8, formatRupiah(cost), "", 0, "R", false, 0, "")
		
		// Draw bottom line
		yMax := yDesc
		if yMax < yStart + 10 {
			yMax = yStart + 10
		}
		
		pdf.SetXY(10, yMax)
		pdf.CellFormat(190, 0, "", "B", 1, "L", false, 0, "")
		pdf.Ln(2)
	}

	pdf.Ln(5)

	// 5. Ringkasan Total
	subtotal := totalCost
	ppn := subtotal * 0.11
	grandTotal := subtotal + ppn

	pdf.SetFont("Arial", "", 9)
	pdf.SetTextColor(113, 128, 150)
	pdf.CellFormat(140, 6, "", "", 0, "R", false, 0, "")
	pdf.CellFormat(20, 6, "Subtotal:", "", 0, "R", false, 0, "")
	pdf.SetTextColor(45, 55, 72)
	pdf.CellFormat(30, 6, formatRupiah(subtotal), "", 1, "R", false, 0, "")

	pdf.SetTextColor(113, 128, 150)
	pdf.CellFormat(140, 6, "", "", 0, "R", false, 0, "")
	pdf.CellFormat(20, 6, "PPN (11%):", "", 0, "R", false, 0, "")
	pdf.SetTextColor(45, 55, 72)
	pdf.CellFormat(30, 6, formatRupiah(ppn), "", 1, "R", false, 0, "")

	pdf.SetFont("Arial", "B", 11)
	pdf.SetTextColor(26, 54, 93) // #1a365d
	pdf.CellFormat(140, 10, "", "", 0, "R", false, 0, "")
	pdf.CellFormat(20, 10, "Total Tagihan:", "T", 0, "R", false, 0, "")
	pdf.CellFormat(30, 10, formatRupiah(grandTotal), "T", 1, "R", false, 0, "")

	// 6. Footer Section
	pdf.Ln(20)
	pdf.SetDrawColor(226, 232, 240) // #e2e8f0
	pdf.CellFormat(190, 0, "", "T", 1, "L", false, 0, "")
	pdf.Ln(5)

	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(74, 85, 104)
	pdf.CellFormat(190, 5, "Informasi Pembayaran:", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(190, 5, "Pembayaran dapat ditransfer melalui rekening berikut:", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(190, 5, "Bang Samsul", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "", 9)
	pdf.CellFormat(190, 5, "No. Rekening: 123-00-9876543-21", "", 1, "L", false, 0, "")
	pdf.CellFormat(190, 5, "Atas Nama: PT. Microdata Indonesia", "", 1, "L", false, 0, "")
	
	pdf.SetFont("Arial", "I", 8)
	pdf.CellFormat(190, 5, "*Harap cantumkan nomor invoice pada berita acara transfer.", "", 1, "L", false, 0, "")

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}
