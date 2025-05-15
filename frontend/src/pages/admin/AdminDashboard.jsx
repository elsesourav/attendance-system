import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Button, Alert } from 'react-bootstrap';
import { userService, courseService, classService } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch teachers
        const teachersResponse = await userService.getUsersByRole('teacher');
        
        // Fetch students
        const studentsResponse = await userService.getUsersByRole('student');
        
        // Fetch courses
        const coursesResponse = await courseService.getAllCourses();
        
        // Fetch classes
        const classesResponse = await classService.getAllClasses();
        
        if (teachersResponse.success && studentsResponse.success && 
            coursesResponse.success && classesResponse.success) {
          setStats({
            totalTeachers: teachersResponse.users.length,
            totalStudents: studentsResponse.users.length,
            totalCourses: coursesResponse.courses.length,
            totalClasses: classesResponse.classes.length
          });
        } else {
          throw new Error('Failed to fetch statistics');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="display-4">{stats.totalTeachers}</h1>
              <Card.Title>Teachers</Card.Title>
            </Card.Body>
            <Card.Footer>
              <Link to="/admin/users">
                <Button variant="outline-primary" size="sm">Manage Teachers</Button>
              </Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="display-4">{stats.totalStudents}</h1>
              <Card.Title>Students</Card.Title>
            </Card.Body>
            <Card.Footer>
              <Link to="/admin/users">
                <Button variant="outline-primary" size="sm">Manage Students</Button>
              </Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="display-4">{stats.totalCourses}</h1>
              <Card.Title>Courses</Card.Title>
            </Card.Body>
            <Card.Footer>
              <Link to="/admin/courses">
                <Button variant="outline-primary" size="sm">Manage Courses</Button>
              </Link>
            </Card.Footer>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="display-4">{stats.totalClasses}</h1>
              <Card.Title>Classes</Card.Title>
            </Card.Body>
            <Card.Footer>
              <Link to="/admin/classes">
                <Button variant="outline-primary" size="sm">Manage Classes</Button>
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Quick Actions</h4>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/admin/users">
                  <Button variant="primary" className="mb-2 w-100">
                    <i className="bi bi-people me-2"></i>
                    Manage Users
                  </Button>
                </Link>
                <Link to="/admin/courses">
                  <Button variant="primary" className="mb-2 w-100">
                    <i className="bi bi-book me-2"></i>
                    Manage Courses
                  </Button>
                </Link>
                <Link to="/admin/classes">
                  <Button variant="primary" className="mb-2 w-100">
                    <i className="bi bi-calendar3 me-2"></i>
                    Manage Classes
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>System Overview</h4>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Attendance System</strong> is running smoothly. Here's a quick overview:
              </p>
              <ul>
                <li>Total Users: {stats.totalTeachers + stats.totalStudents + 1} (including admin)</li>
                <li>Total Courses: {stats.totalCourses}</li>
                <li>Total Classes: {stats.totalClasses}</li>
                <li>System Version: 1.0.0</li>
                <li>Last Updated: {new Date().toLocaleDateString()}</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
