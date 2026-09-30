import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getUserDetail, getAllUsers, createUser, updateUser, deleteUser, searchParticipantUsers } from "../services/user.service";
import { successResponse } from "../utils/response";

export const getUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    const user = await getUserDetail(req.params.id);
    successResponse(res, "User retrieved successfully", user);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const currentUserId = req.user?.id;
    if (search) {
      const users = await searchParticipantUsers(search, currentUserId);
      return successResponse(res, "Users searched successfully", users);
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }

    const users = await getAllUsers();

    successResponse(res, "User retrieved successfully", users);
  } catch (err) {
    next(err);
  }
};

export const postUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  if (!req.body) {
    return res.status(400).json({ message: "Request body is required" });
  }

  try {
    const newUser = await createUser(req.body);

    if (newUser === null) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

export const putUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    const updatedUser = await updateUser(req.params.id, { email: req.body.email });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found or update failed" });
    }
    return res.status(200).json({ message: "User updated successfully", data: updatedUser });
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    await deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
