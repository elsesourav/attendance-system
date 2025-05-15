import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = ({ user }) => {
  useEffect(() => {
    // This component just redirects to the appropriate dashboard
  }, []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" />;
    case 'teacher':
      return <Navigate to="/teacher" />;
    case 'student':
      return <Navigate to="/student" />;
    default:
      return (
        <div className="text-center mt-5">
          <h2>Welcome to the Attendance System</h2>
          <p>Your role is not recognized. Please contact an administrator.</p>
        </div>
      );
  }
};

export default Dashboard;
