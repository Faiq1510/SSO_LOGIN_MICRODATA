import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorHandler } from "@backend/middlewares/error.middleware";
import logger from "@backend/utils/logger";
import { createMockReq, createMockRes, createMockNext } from "../../helpers/mock-req-res";

vi.mock("@backend/utils/logger", () => ({
  default: {
    error: vi.fn(),
  },
}));

describe("Error Middleware Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it("should log error message and respond with 500 status", () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();
    const err = new Error("Database error occurred");

    errorHandler(err, req, res, next);

    expect(logger.error).toHaveBeenCalledWith("Database error occurred");
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Database error occurred" });
  });
});
