import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import Unauthorized from '@/pages/Unauthorized';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole(user);

  // Avoid redirecting while auth/role are loading
  if (authLoading || roleLoading) {
    console.debug('ProtectedRoute: waiting for auth/role', { authLoading, roleLoading });
    return <div>Loading...</div>;
  }

  if (!user) {
    console.debug('ProtectedRoute: no user, redirect to login');
    return <Navigate to="/login" replace />;
  }

  // If role couldn't be determined, show unauthorized rather than redirecting to login
  if (!role) {
    console.debug('ProtectedRoute: role not found for user', { user });
    return <Unauthorized />;
  }

  // Normalize role/allowedRoles for comparison
  const normalizedRole = role ? role.toLowerCase() : '';
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (!normalizedAllowed.includes(normalizedRole)) {
    console.debug('ProtectedRoute: role not allowed', { role, allowedRoles });
    // Redirect to appropriate dashboard based on role
    if (normalizedRole === 'researcher') {
      return <Navigate to="/researcher/dashboard" replace />;
    } else if (normalizedRole === 'reviewer') {
      return <Navigate to="/reviewer/dashboard" replace />;
    } else if (normalizedRole === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Unauthorized />;
  }

  return <>{children}</>;
}
