import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If requiredRole is specified and user doesn't have that role, redirect to appropriate dashboard
  if (requiredRole && user.role !== requiredRole) {
    // Admin can access all routes
    if (user.role === 'admin' && requiredRole !== 'student') {
      return children;
    }
    
    // Redirect to appropriate dashboard based on user role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If all checks pass, render the protected component
  return children;
};

export default ProtectedRoute;
