import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfil } from "@backend/controllers/profil.controller";
import * as profilRepo from "@backend/repositories/profil-peserta.repository";
import * as userRepo from "@backend/repositories/user.repository";
import { createMockReq, createMockRes, createMockNext } from "../helpers/mock-req-res";

vi.mock("@backend/repositories/profil-peserta.repository");
vi.mock("@backend/repositories/user.repository");

describe("Onboarding Controller Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("updateProfil", () => {
    it("should update profil and progress onboarding status to step_1_selesai", async () => {
      const user = { id: "uuid-user-1", email: "user@test.com", role: "peserta" };
      const req = createMockReq({
        user,
        body: {
          nama_lengkap: "Budi Santoso",
          jenjang_pendidikan: "kuliah",
          nim_nisn: "123456",
          institusi: "UI",
          program_studi: "TI",
          cv_url: "https://mock-s3.com/cv.pdf",
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      vi.mocked(profilRepo.findProfilByUserId).mockResolvedValue(null);
      vi.mocked(profilRepo.insertProfil).mockResolvedValue({
        id: "uuid-profil-1",
        user_id: "uuid-user-1",
        nama_lengkap: "Budi Santoso",
        jenjang_pendidikan: "kuliah",
        nim_nisn: "123456",
        institusi: "UI",
        program_studi: "TI",
        cv_url: "https://mock-s3.com/cv.pdf",
        onboarding_status: "step_1_selesai",
      } as any);
      vi.mocked(userRepo.findUserById).mockResolvedValue(user as any);

      await updateProfil(req, res, next);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          message: "Profile updated successfully",
          data: expect.objectContaining({
            profile: expect.objectContaining({
              onboarding_status: "step_1_selesai",
            }),
          }),
        })
      );
    });
  });
});
