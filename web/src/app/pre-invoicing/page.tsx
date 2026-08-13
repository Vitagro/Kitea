import { PreInvoiceControlDesk } from "@/components/Invoicing/PreInvoiceControlDesk";

export default function PreInvoicingPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900 mb-4">Facturation intragroupe & Pré-Facturation</h1>
      <PreInvoiceControlDesk />
    </div>
  );
}
