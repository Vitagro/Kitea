import { PricingConfigurator } from "@/components/Pricing/PricingConfigurator";

export default function PricingPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Configurateur de tarifs</h1>
      <PricingConfigurator />
    </div>
  );
}
