import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Home from "@/pages/home";
import InspectionForm from "@/pages/inspection-form";
import AdminDashboard from "@/pages/admin-dashboard";
import CMIDashboard from "@/pages/cmi-dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('Router state:', { isAuthenticated, isLoading, user });

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/cmi" component={CMIDashboard} />
          <Route path="/inspection" component={InspectionForm} />
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <OfflineIndicator />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
