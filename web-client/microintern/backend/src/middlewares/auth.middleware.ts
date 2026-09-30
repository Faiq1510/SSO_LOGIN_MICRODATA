import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { findUserById, User } from "../repositories/user.repository";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Token is missing.",
    });
  }

  try {
    const decoded = verifyAccessToken(token) as any;
    if (decoded && decoded.id) {
      const user = await findUserById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: User not found.",
    });
  } catch (err) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized: Invalid or expired token.",
    });
  }
};
