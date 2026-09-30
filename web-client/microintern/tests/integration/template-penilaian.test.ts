import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminGetAllTemplates, adminGetTemplateById, adminCreateTemplate, adminUpdateTemplate, adminDeleteTemplate } from "@backend/controllers/template-penilaian.controller";
import * as templateRepo from "@backend/repositories/template-penilaian.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/template-penilaian.repository");

describe("Template Penilaian Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("adminGetAllTemplates", () => {
    it("should return 403 if non-admin attempts to access", async () => {
      const req = createMockReq({ user: { id: "u1", role: "peserta" } });
      const res = createMockRes();
      const next = createMockNext();

      await adminGetAllTemplates(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should return all templates for admin", async () => {
      const req = createMockReq({ user: { id: "a1", role: "admin" } });
      const res = createMockRes();
      const next = createMockNext();

      const mockTemplates = [{ id: "t1", nama_template: "Template Standar" }];
      vi.mocked(templateRepo.findAllTemplatesWithKriteria).mockResolvedValue(mockTemplates as any);

      await adminGetAllTemplates(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: mockTemplates,
        })
      );
    });
  });

  describe("adminGetTemplateById", () => {
    it("should return template by id", async () => {
      const req = createMockReq({ user: { id: "a1", role: "admin" }, params: { id: "t1" } });
      const res = createMockRes();
      const next = createMockNext();

      const mockTemplate = { id: "t1", nama_template: "Template 1" };
      vi.mocked(templateRepo.findTemplateById).mockResolvedValue(mockTemplate as any);

      await adminGetTemplateById(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: mockTemplate,
        })
      );
    });

    it("should return 404 if template not found", async () => {
      const req = createMockReq({ user: { id: "a1", role: "admin" }, params: { id: "invalid" } });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(templateRepo.findTemplateById).mockResolvedValue(null);

      await adminGetTemplateById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("adminCreateTemplate", () => {
    it("should create new template successfully", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        body: {
          nama_template: "Template Baru",
          institusi: "UI",
          kriteria: ["Disiplin", "Kerjasama"],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const created = { id: "t2", nama_template: "Template Baru" };
      vi.mocked(templateRepo.createTemplate).mockResolvedValue(created as any);
      vi.mocked(templateRepo.replaceKriteriaForTemplate).mockResolvedValue(undefined as any);
      vi.mocked(templateRepo.findTemplateById).mockResolvedValue(created as any);

      await adminCreateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: created,
        })
      );
    });

    it("should return 400 if nama_template is missing", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        body: { kriteria: ["Disiplin"] },
      });
      const res = createMockRes();
      const next = createMockNext();

      await adminCreateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("adminUpdateTemplate", () => {
    it("should update template successfully", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        params: { id: "t1" },
        body: {
          nama_template: "Template Updated",
          kriteria: ["Kehadiran"],
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const existing = { id: "t1", nama_template: "Old" };
      const updated = { id: "t1", nama_template: "Template Updated" };

      vi.mocked(templateRepo.findTemplateById)
        .mockResolvedValueOnce(existing as any)
        .mockResolvedValueOnce(updated as any);
      vi.mocked(templateRepo.updateTemplate).mockResolvedValue(updated as any);
      vi.mocked(templateRepo.replaceKriteriaForTemplate).mockResolvedValue(undefined as any);

      await adminUpdateTemplate(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: updated,
        })
      );
    });

    it("should return 404 if template not found", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        params: { id: "invalid" },
        body: { nama_template: "Name" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(templateRepo.findTemplateById).mockResolvedValue(null);

      await adminUpdateTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe("adminDeleteTemplate", () => {
    it("should delete template successfully", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        params: { id: "t1" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(templateRepo.findTemplateById).mockResolvedValue({ id: "t1", is_default: false } as any);
      vi.mocked(templateRepo.deleteTemplate).mockResolvedValue(true);

      await adminDeleteTemplate(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Template deleted successfully",
        })
      );
    });

    it("should return 400 if trying to delete default template", async () => {
      const req = createMockReq({
        user: { id: "a1", role: "admin" },
        params: { id: "default_id" },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(templateRepo.findTemplateById).mockResolvedValue({ id: "default_id", is_default: true } as any);

      await adminDeleteTemplate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Cannot delete the default template",
        })
      );
    });
  });
});
