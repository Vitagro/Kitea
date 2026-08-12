import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Layout/Sidebar";
import { MapPage } from "./pages/MapPage";
import { LocationsPage } from "./pages/LocationsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PricingPage } from "./pages/PricingPage";
import { ConsolidationPage } from "./pages/ConsolidationPage";
import { ShipmentsPage } from "./pages/ShipmentsPage";
import { PreInvoicingPage } from "./pages/PreInvoicingPage";
import { ErpIntegrationPage } from "./pages/ErpIntegrationPage";
import { ReferencesPage } from "./pages/ReferencesPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/consolidation" element={<ConsolidationPage />} />
            <Route path="/shipments" element={<ShipmentsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/pre-invoicing" element={<PreInvoicingPage />} />
            <Route path="/erp" element={<ErpIntegrationPage />} />
            <Route path="/references" element={<ReferencesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
