import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";
import {
   Navigate,
   Route,
   BrowserRouter as Router,
   Routes,
} from "react-router-dom";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageUsers from "./pages/admin/ManageUsers";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentDashboard from "./pages/student/StudentDashboard";
import AttendanceReport from "./pages/teacher/AttendanceReport";
import ClassDetails from "./pages/teacher/ClassDetails";
import TakeAttendance from "./pages/teacher/TakeAttendance";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

function App() {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      // Check if user is logged in
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         setUser(JSON.parse(storedUser));
      }
      setLoading(false);
   }, []);

   const handleLogin = (userData) => {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
   };

   const handleLogout = () => {
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
   };

   if (loading) {
      return (
         <div className="d-flex justify-content-center align-items-center vh-100">
            Loading...
         </div>
      );
   }

   return (
      <Router>
         <div className="App">
            <Navbar user={user} onLogout={handleLogout} />
            <div className="container mt-4">
               <Routes>
                  <Route
                     path="/"
                     element={
                        user ? (
                           <Dashboard user={user} />
                        ) : (
                           <Navigate to="/login" />
                        )
                     }
                  />
                  <Route
                     path="/login"
                     element={
                        user ? (
                           <Navigate to="/" />
                        ) : (
                           <Login onLogin={handleLogin} />
                        )
                     }
                  />

                  {/* Admin Routes */}
                  <Route
                     path="/admin"
                     element={
                        <ProtectedRoute user={user} requiredRole="admin">
                           <AdminDashboard />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/admin/users"
                     element={
                        <ProtectedRoute user={user} requiredRole="admin">
                           <ManageUsers />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/admin/courses"
                     element={
                        <ProtectedRoute user={user} requiredRole="admin">
                           <ManageCourses />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/admin/classes"
                     element={
                        <ProtectedRoute user={user} requiredRole="admin">
                           <ManageClasses />
                        </ProtectedRoute>
                     }
                  />

                  {/* Teacher Routes */}
                  <Route
                     path="/teacher"
                     element={
                        <ProtectedRoute user={user} requiredRole="teacher">
                           <TeacherDashboard />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/teacher/class/:id"
                     element={
                        <ProtectedRoute user={user} requiredRole="teacher">
                           <ClassDetails />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/teacher/attendance/:classId"
                     element={
                        <ProtectedRoute user={user} requiredRole="teacher">
                           <TakeAttendance />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/teacher/report/:classId"
                     element={
                        <ProtectedRoute user={user} requiredRole="teacher">
                           <AttendanceReport />
                        </ProtectedRoute>
                     }
                  />

                  {/* Student Routes */}
                  <Route
                     path="/student"
                     element={
                        <ProtectedRoute user={user} requiredRole="student">
                           <StudentDashboard />
                        </ProtectedRoute>
                     }
                  />
                  <Route
                     path="/student/attendance/:classId"
                     element={
                        <ProtectedRoute user={user} requiredRole="student">
                           <StudentAttendance />
                        </ProtectedRoute>
                     }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
               </Routes>
            </div>
         </div>
      </Router>
   );
}

export default App;
