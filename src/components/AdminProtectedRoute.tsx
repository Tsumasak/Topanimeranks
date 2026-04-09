import { Navigate } from "react-router-dom";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const isAuthenticated = localStorage.getItem("adminAuth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
}
