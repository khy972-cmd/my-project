import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { normalizeAppRole, type AppRole } from "@/lib/roles";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
  allowPending?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/",
  allowPending = false,
}: ProtectedRouteProps) {
  const { session, initialized, isTestMode } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const hasRoleRequirement = Boolean(allowedRoles && allowedRoles.length > 0);

  if (!initialized || (!!session && !isTestMode && roleLoading)) {
    return <LoadingScreen />;
  }

  if (!session && !isTestMode) {
    const authTarget = `/auth${location.search}${location.hash}`;
    return <Navigate to={authTarget} replace state={{ from: location }} />;
  }

  if (!!session && !isTestMode && !role && !allowPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (hasRoleRequirement) {
    const currentRole = normalizeAppRole(role);
    if (!allowedRoles?.includes(currentRole)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
