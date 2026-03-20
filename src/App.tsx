import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
const AppLayout = lazy(() => import("@/components/layout/AppLayout"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const SitePage = lazy(() => import("@/pages/SitePage"));
const WorklogPage = lazy(() => import("@/pages/WorklogPage"));
const OutputPage = lazy(() => import("@/pages/OutputPage"));
const DocPage = lazy(() => import("@/pages/DocPage"));
const RequestPage = lazy(() => import("@/pages/RequestPage"));
const RequestExternalPage = lazy(() => import("@/pages/RequestExternalPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const PendingApprovalPage = lazy(() => import("@/pages/PendingApprovalPage"));
import NotFound from "@/pages/NotFound";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const SmartPhotoSheetPage = lazy(() => import("@/features/smartPhotoSheet/SmartPhotoSheetPage"));

const queryClient = new QueryClient();
const RouteFallback = <LoadingScreen />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <Suspense fallback={RouteFallback}>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/pending-approval"
                  element={
                    <ProtectedRoute allowPending>
                      <PendingApprovalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager"]} redirectTo="/">
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/home/*" element={<Navigate to="/" replace />} />
                <Route path="/home.html" element={<Navigate to="/" replace />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<HomePage />} />
                  <Route path="/site" element={<SitePage />} />
                  <Route path="/worklog" element={<WorklogPage />} />
                  <Route path="/output" element={<OutputPage />} />
                  <Route path="/doc" element={<DocPage />} />
                  <Route path="/photo-sheet" element={<SmartPhotoSheetPage />} />
                  <Route
                    path="/request"
                    element={
                      <ProtectedRoute allowedRoles={["admin", "worker"]}>
                        <RequestPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/request/external" element={<RequestExternalPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
