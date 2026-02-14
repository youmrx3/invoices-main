
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { getBusinessSettings } from "@/lib/businessSettings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClientManagementPage from "./pages/ClientManagement";
import DocumentTypeSettingsPage from "./pages/DocumentTypeSettings";
import SharedInvoiceView from "./components/SharedInvoiceView";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Set favicon to match business logo
    const settings = getBusinessSettings();
    if (settings.logoEnabled && settings.logoUrl) {
      let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }
      favicon.href = settings.logoUrl;
      favicon.type = "image/x-icon";
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<ClientManagementPage />} />
            <Route path="/invoice" element={<SharedInvoiceView />} />
            <Route path="/settings" element={<DocumentTypeSettingsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
