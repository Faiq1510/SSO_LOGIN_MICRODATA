import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userRepo from "@backend/repositories/user.repository";
import { getUserDetail, getAllUsers, searchParticipantUsers, createUser, updateUser, deleteUser } from "@backend/services/user.service";

vi.mock("@backend/repositories/user.repository");

describe("User Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe("getUserDetail", () => {
    it("should return user detail if user exists", async () => {
      const mockUser = { id: "u1", email: "user1@test.com", role: "peserta" };
      vi.mocked(userRepo.findUserById).mockResolvedValue(mockUser as any);

      const result = await getUserDetail("u1");
      expect(result).toEqual(mockUser);
      expect(userRepo.findUserById).toHaveBeenCalledWith("u1");
    });

    it("should throw error if user does not exist", async () => {
      vi.mocked(userRepo.findUserById).mockResolvedValue(null);

      await expect(getUserDetail("invalid_id")).rejects.toThrow("User not found");
    });
  });

  describe("getAllUsers", () => {
    it("should return list of all users", async () => {
      const mockUsers = [
        { id: "u1", email: "u1@test.com" },
        { id: "u2", email: "u2@test.com" },
      ];
      vi.mocked(userRepo.findAllUsers).mockResolvedValue(mockUsers as any);

      const result = await getAllUsers();
      expect(result).toHaveLength(2);
      expect(userRepo.findAllUsers).toHaveBeenCalled();
    });
  });

  describe("searchParticipantUsers", () => {
    it("should search participant users with query and optional exclude ID", async () => {
      const mockUsers = [{ id: "u2", email: "u2@test.com" }];
      vi.mocked(userRepo.searchUsers).mockResolvedValue(mockUsers as any);

      const result = await searchParticipantUsers("query", "u1");
      expect(result).toEqual(mockUsers);
      expect(userRepo.searchUsers).toHaveBeenCalledWith("query", "u1");
    });
  });

  describe("createUser", () => {
    it("should insert user data into repo", async () => {
      const input = { name: "Budi", email: "budi@test.com", password: "pass" };
      const created = { id: "u3", ...input };
      vi.mocked(userRepo.insertUser).mockResolvedValue(created as any);

      const result = await createUser(input);
      expect(result).toEqual(created);
      expect(userRepo.insertUser).toHaveBeenCalledWith(input);
    });
  });

  describe("updateUser", () => {
    it("should update user if user exists", async () => {
      const updated = { id: "u1", name: "Budi Updated", email: "budi@test.com" };
      vi.mocked(userRepo.modifyUser).mockResolvedValue(updated as any);

      const result = await updateUser("u1", { name: "Budi Updated" });
      expect(result).toEqual(updated);
      expect(userRepo.modifyUser).toHaveBeenCalledWith("u1", { name: "Budi Updated" });
    });

    it("should throw error if update returned null", async () => {
      vi.mocked(userRepo.modifyUser).mockResolvedValue(null as any);

      await expect(updateUser("invalid_id", { name: "New" })).rejects.toThrow("User not found or update failed");
    });
  });

  describe("deleteUser", () => {
    it("should resolve when deletion succeeds", async () => {
      vi.mocked(userRepo.removeUserById).mockResolvedValue(true);

      await expect(deleteUser("u1")).resolves.toBeUndefined();
      expect(userRepo.removeUserById).toHaveBeenCalledWith("u1");
    });

    it("should throw error when deletion returns false", async () => {
      vi.mocked(userRepo.removeUserById).mockResolvedValue(false);

      await expect(deleteUser("invalid_id")).rejects.toThrow("User not found or delete failed");
    });
  });
});
