import { Response } from "express";

export const successResponse = (res: Response, message: string, data: any = null, statusCode: number = 200, pagination?: any) => {
  if (statusCode === 204) return res.status(statusCode).send();
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
    ...(pagination ? { pagination } : {}),
  });
};
