import { describe, it, expect, vi } from "vitest";
import { successResponse } from "@backend/utils/response";
import { createMockRes } from "../../helpers/mock-req-res";

describe("Response Utility Unit Tests", () => {
  it("should return empty response for status 204", () => {
    const res = createMockRes();
    res.send = vi.fn().mockReturnValue(res);

    successResponse(res, "No Content", null, 204);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return success response JSON format", () => {
    const res = createMockRes();

    successResponse(res, "Data fetched", { id: 1 }, 200);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Data fetched",
      data: { id: 1 },
    });
  });

  it("should include pagination when passed", () => {
    const res = createMockRes();
    const pagination = { page: 1, total: 10 };

    successResponse(res, "List fetched", [], 200, pagination);

    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "List fetched",
      data: [],
      pagination: { page: 1, total: 10 },
    });
  });
});
