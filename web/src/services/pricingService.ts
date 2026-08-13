import { apiClient } from "../lib/apiClient";
import { PricingRule } from "../types";

export type CreatePricingRulePayload = Omit<PricingRule, "id" | "isActive">;

export const pricingService = {
  list(filters?: { ruleType?: string; source?: string; activeOnly?: boolean }): Promise<PricingRule[]> {
    return apiClient.get<PricingRule[]>("/pricing-rules", filters);
  },

  create(payload: CreatePricingRulePayload): Promise<PricingRule> {
    return apiClient.post<PricingRule>("/pricing-rules", payload);
  },

  update(id: string, payload: Partial<CreatePricingRulePayload>): Promise<PricingRule> {
    return apiClient.patch<PricingRule>(`/pricing-rules/${id}`, payload);
  },

  deactivate(id: string): Promise<void> {
    return apiClient.delete(`/pricing-rules/${id}`);
  },
};
