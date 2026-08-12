import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Layout/Sidebar";
import { MapPage } from "./pages/MapPage";
import { PricingPage } from "./pages/PricingPage";
import { ConsolidationPage } from "./pages/ConsolidationPage";
import { PreInvoicingPage } from "./pages/PreInvoicingPage";
import { ErpIntegrationPage } from "./pages/ErpIntegrationPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/consolidation" element={<ConsolidationPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/pre-invoicing" element={<PreInvoicingPage />} />
            <Route path="/erp" element={<ErpIntegrationPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
