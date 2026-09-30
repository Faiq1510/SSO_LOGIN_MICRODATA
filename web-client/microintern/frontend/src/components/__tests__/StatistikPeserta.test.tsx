import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StatistikPeserta from "../StatistikPeserta";
import * as pesertaService from "../../services/peserta.service";

vi.mock("../../services/peserta.service");

describe("StatistikPeserta Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders statistics correctly after loading", async () => {
    vi.mocked(pesertaService.getParticipantStats).mockResolvedValue({
      status: "success",
      message: "Success",
      data: {
        by_prodi: [{ label: "Informatika", count: 10 }],
        by_institusi: [{ label: "Universitas Tekno", count: 10 }],
        by_jenjang: [{ label: "kuliah", count: 10 }],
        by_tipe: [{ label: "individu", count: 10 }],
        durasi: { min: 30, avg: 60, max: 90 },
      },
    });

    render(<StatistikPeserta />);

    await waitFor(() => {
      expect(screen.getByText("Durasi Magang")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Informatika").length).toBeGreaterThan(0);

    const instTab = screen.getByRole("button", { name: /institusi/i });
    fireEvent.click(instTab);

    expect(screen.getByText("Universitas Tekno")).toBeInTheDocument();
  });
});
