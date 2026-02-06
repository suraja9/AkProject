import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";


import AdminDashboard from "./pages/AdminDashboard";
import AdminAudits from "./pages/AdminAudits";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminFounders from "./pages/AdminFounders";
import AdminLive from "./pages/AdminLive";
import AdminUsageAnalytics from "./pages/AdminUsageAnalytics";
import AdminFunnel from "./pages/AdminFunnel";
import AdminBusinessMetrics from "./pages/AdminBusinessMetrics";
import AdminTimeTrends from "./pages/AdminTimeTrends";
import AdminReports from "./pages/AdminReports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/audits" element={<AdminAudits />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/analytics/usage" element={<AdminUsageAnalytics />} />
          <Route path="/admin/analytics/funnel" element={<AdminFunnel />} />
          <Route path="/admin/analytics/business" element={<AdminBusinessMetrics />} />
          <Route path="/admin/analytics/trends" element={<AdminTimeTrends />} />
          <Route path="/admin/founders" element={<AdminFounders />} />
          <Route path="/admin/live" element={<AdminLive />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
