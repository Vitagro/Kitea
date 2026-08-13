import { apiClient } from "../lib/apiClient";
import { Employee } from "../types";

export type CreateEmployeePayload = Omit<Employee, "id" | "isActive" | "location">;

export const employeesService = {
  list(filters?: { role?: string; locationId?: string; activeOnly?: boolean }): Promise<Employee[]> {
    return apiClient.get<Employee[]>("/employees", filters);
  },

  getById(id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`);
  },

  create(payload: CreateEmployeePayload): Promise<Employee> {
    return apiClient.post<Employee>("/employees", payload);
  },

  update(id: string, payload: Partial<CreateEmployeePayload>): Promise<Employee> {
    return apiClient.patch<Employee>(`/employees/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/employees/${id}`);
  },

  reactivate(id: string): Promise<Employee> {
    return apiClient.post<Employee>(`/employees/${id}/reactivate`);
  },
};
