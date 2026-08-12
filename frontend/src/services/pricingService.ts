import { apiClient } from "./apiClient";
import { PricingRule } from "../types";

export type CreatePricingRulePayload = Omit<PricingRule, "id" | "isActive">;

export const pricingService = {
  async list(filters?: { ruleType?: string; source?: string; activeOnly?: boolean }): Promise<PricingRule[]> {
    const { data } = await apiClient.get<PricingRule[]>("/pricing-rules", { params: filters });
    return data;
  },

  async create(payload: CreatePricingRulePayload): Promise<PricingRule> {
    const { data } = await apiClient.post<PricingRule>("/pricing-rules", payload);
    return data;
  },

  async update(id: string, payload: Partial<CreatePricingRulePayload>): Promise<PricingRule> {
    const { data } = await apiClient.patch<PricingRule>(`/pricing-rules/${id}`, payload);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/pricing-rules/${id}`);
  },
};
