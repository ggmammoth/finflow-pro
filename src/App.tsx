import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Recurring from "./pages/Recurring";
import Reports from "./pages/Reports";
import Budgets from "./pages/Budgets";
import Planning from "./pages/Planning";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Family from "./pages/Family";
import FamilyMembers from "./pages/FamilyMembers";
import ChildDashboard from "./pages/ChildDashboard";
import FamilySettings from "./pages/FamilySettings";
import AcceptInvite from "./pages/AcceptInvite";

import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/income" element={<Navigate to="/transactions" replace />} />
              <Route path="/expenses" element={<Navigate to="/transactions" replace />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/family" element={<Family />} />
              <Route path="/family/members" element={<Navigate to="/family?tab=members" replace />} />
              <Route path="/family/child" element={<ChildDashboard />} />
              <Route path="/family/settings" element={<Navigate to="/family?tab=settings" replace />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
