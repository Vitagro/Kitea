import { apiClient } from "../lib/apiClient";
import { User } from "../types";

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", { email, password });
  },

  me(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  },
};
