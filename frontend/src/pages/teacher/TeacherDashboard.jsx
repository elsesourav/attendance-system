import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Alert } from 'react-bootstrap';
import { classService } from '../../services/api';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('User not found');
        }

        const response = await classService.getClassesByTeacher(user.id);
        if (response.success) {
          setClasses(response.classes);
        } else {
          throw new Error(response.message || 'Failed to fetch classes');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Teacher Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h4>My Classes</h4>
            </Card.Header>
            <Card.Body>
              {classes.length === 0 ? (
                <p className="text-center">No classes assigned to you yet.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Semester</th>
                      <th>Academic Year</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>{cls.courseCode}</td>
                        <td>{cls.courseTitle}</td>
                        <td>{cls.semester}</td>
                        <td>{cls.academicYear}</td>
                        <td>
                          <Link to={`/teacher/class/${cls.id}`}>
                            <Button variant="info" size="sm" className="me-2">
                              View Details
                            </Button>
                          </Link>
                          <Link to={`/teacher/attendance/${cls.id}`}>
                            <Button variant="primary" size="sm" className="me-2">
                              Take Attendance
                            </Button>
                          </Link>
                          <Link to={`/teacher/report/${cls.id}`}>
                            <Button variant="secondary" size="sm">
                              Attendance Report
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Quick Actions</h4>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-calendar-check me-2"></i>
                  Take attendance for today's classes
                </li>
                <li className="mb-2">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  View attendance reports
                </li>
                <li className="mb-2">
                  <i className="bi bi-people me-2"></i>
                  Manage student enrollments
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Recent Activity</h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">No recent activities to display.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
