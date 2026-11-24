import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const location = useLocation();
  const { isAuthenticated, user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF9F2] text-sm font-medium text-[#641B32]">
        Verifying your Taantira session...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user.roles || [];
    const permitted = userRoles.includes('super_admin') || allowedRoles.some((r) => userRoles.includes(r));
    if (!permitted) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FFF9F2] p-6 text-center">
          <h1 className="text-2xl font-bold text-[#641B32]">Access Restricted</h1>
          <p className="max-w-md text-sm text-[#3D1023]/80">
            Your signed-in account ({user.email}) does not have the required role privileges for this portal.
          </p>
        </div>
      );
    }
  }

  return children;
}
