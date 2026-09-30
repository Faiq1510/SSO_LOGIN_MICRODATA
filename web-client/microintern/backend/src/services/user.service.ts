import { findUserById, findAllUsers, insertUser, modifyUser, removeUserById, searchUsers } from "../repositories/user.repository";

export const getUserDetail = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw new Error("User not found");
  return user;
};

export const getAllUsers = async () => {
  return await findAllUsers();
};

export const searchParticipantUsers = async (query: string, excludeUserId?: string) => {
  return await searchUsers(query, excludeUserId);
};

export const createUser = async (data: { email: string; password: string }) => {
  const { email, password } = data;
  return await insertUser({ email, password_hash: password, role: "peserta" });
};

export const updateUser = async (id: string, data: { email?: string }) => {
  const updated = await modifyUser(id, data);
  if (!updated) throw new Error("User not found or update failed");
  return updated;
};

export const deleteUser = async (id: string) => {
  const success = await removeUserById(id);
  if (!success) throw new Error("User not found or delete failed");
};
