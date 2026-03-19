import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { normalizeAppRole, type AppRole } from "@/lib/roles";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { session, loading, isTestMode } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const hasRoleRequirement = Boolean(allowedRoles && allowedRoles.length > 0);
  const waitingForRole = hasRoleRequirement && !!session && !role && !roleLoading;

  if (loading || (hasRoleRequirement && roleLoading) || waitingForRole) {
    return <LoadingScreen />;
  }

  if (!session && !isTestMode) {
    const authTarget = `/auth${location.search}${location.hash}`;
    return <Navigate to={authTarget} replace state={{ from: location }} />;
  }

  if (hasRoleRequirement) {
    const currentRole = normalizeAppRole(role);
    if (!allowedRoles?.includes(currentRole)) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <>{children}</>;
}
