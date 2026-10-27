import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import CarResult from "./pages/CarResult.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import SignUp from "./pages/SignUp.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import BuyerDashboard from "./pages/BuyerDashboard.tsx";
import SellerDashboard from "./pages/SellerDashboard.tsx";
import SellerListings from "./pages/SellerListings.tsx";
import SellerListingForm from "./pages/SellerListingForm.tsx";
import Account from "./pages/Account.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/result" element={<CarResult />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/buyer/dashboard" element={<ProtectedRoute mode="buyer"><BuyerDashboard /></ProtectedRoute>} />
            <Route path="/seller/dashboard" element={<ProtectedRoute mode="seller"><SellerDashboard /></ProtectedRoute>} />
            <Route path="/seller/listings" element={<ProtectedRoute mode="seller"><SellerListings /></ProtectedRoute>} />
            <Route path="/seller/listings/new" element={<ProtectedRoute mode="seller"><SellerListingForm /></ProtectedRoute>} />
            <Route path="/seller/listings/:id/edit" element={<ProtectedRoute mode="seller"><SellerListingForm /></ProtectedRoute>} />
            <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
