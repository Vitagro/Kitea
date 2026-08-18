import { apiClient } from "../lib/apiClient";
import { User } from "../types";

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: User["role"];
  employeeId?: string;
}

export type UpdateUserPayload = Partial<Omit<CreateUserPayload, "password">> & {
  password?: string;
  isActive?: boolean;
};

export const usersService = {
  list(): Promise<User[]> {
    return apiClient.get<User[]>("/users");
  },

  create(payload: CreateUserPayload): Promise<User> {
    return apiClient.post<User>("/users", payload);
  },

  update(id: string, payload: UpdateUserPayload): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },

  reactivate(id: string): Promise<User> {
    return apiClient.post<User>(`/users/${id}/reactivate`);
  },
};
