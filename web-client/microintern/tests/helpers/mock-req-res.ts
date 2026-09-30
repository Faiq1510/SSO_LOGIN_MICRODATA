import { vi } from "vitest";

export const createMockReq = (overrides = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as any;
};

export const createMockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => {
  return vi.fn() as any;
};
