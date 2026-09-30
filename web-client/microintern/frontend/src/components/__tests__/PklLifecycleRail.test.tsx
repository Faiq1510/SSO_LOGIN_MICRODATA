import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PklLifecycleRail from "../PklLifecycleRail";

describe("PklLifecycleRail Component", () => {
  it("renders all three lifecycle steps", () => {
    render(<PklLifecycleRail stage="belum_daftar" variant="onboarding" />);
    expect(screen.getByText("Daftar")).toBeInTheDocument();
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    expect(screen.getByText("Selesai")).toBeInTheDocument();
  });

  it("renders pending stage correctly", () => {
    render(<PklLifecycleRail stage="menunggu" variant="hero" />);
    expect(screen.getByText("Pengajuan PKL")).toBeInTheDocument();
  });

  it("renders aktif stage correctly", () => {
    render(<PklLifecycleRail stage="aktif" variant="sidebar" />);
    expect(screen.getByText("Daftar")).toBeInTheDocument();
  });

  it("renders selesai stage correctly", () => {
    render(<PklLifecycleRail stage="selesai" variant="hero" />);
    expect(screen.getByText("Selesai")).toBeInTheDocument();
  });

  it("renders ditolak stage correctly", () => {
    render(<PklLifecycleRail stage="ditolak" variant="onboarding" />);
    expect(screen.getByText("Daftar")).toBeInTheDocument();
  });
});
