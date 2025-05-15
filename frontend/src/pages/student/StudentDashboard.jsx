import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Row, Col, Table, Button, Alert, ProgressBar } from 'react-bootstrap';
import { classService, attendanceService } from '../../services/api';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('User not found');
        }

        // Fetch enrolled classes
        const classResponse = await classService.getClassesByStudent(user.id);
        if (classResponse.success) {
          setClasses(classResponse.classes);
          
          // Fetch attendance summary for each class
          const summaryData = {};
          for (const cls of classResponse.classes) {
            const attendanceResponse = await attendanceService.getStudentAttendance(cls.id, user.id);
            if (attendanceResponse.success) {
              summaryData[cls.id] = attendanceResponse.statistics;
            }
          }
          setAttendanceSummary(summaryData);
        } else {
          throw new Error(classResponse.message || 'Failed to fetch classes');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Student Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h4>My Courses</h4>
            </Card.Header>
            <Card.Body>
              {classes.length === 0 ? (
                <p className="text-center">You are not enrolled in any courses yet.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Title</th>
                      <th>Teacher</th>
                      <th>Attendance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id}>
                        <td>{cls.courseCode}</td>
                        <td>{cls.courseTitle}</td>
                        <td>{cls.teacherName}</td>
                        <td>
                          {attendanceSummary[cls.id] ? (
                            <div>
                              <ProgressBar 
                                now={attendanceSummary[cls.id].attendancePercentage} 
                                label={`${attendanceSummary[cls.id].attendancePercentage}%`}
                                variant={
                                  attendanceSummary[cls.id].attendancePercentage >= 75 ? 'success' :
                                  attendanceSummary[cls.id].attendancePercentage >= 60 ? 'warning' : 'danger'
                                }
                              />
                              <small className="text-muted">
                                Present: {attendanceSummary[cls.id].presentCount}, 
                                Absent: {attendanceSummary[cls.id].absentCount}, 
                                Late: {attendanceSummary[cls.id].lateCount}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">No data</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/student/attendance/${cls.id}`}>
                            <Button variant="primary" size="sm">
                              View Attendance
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
              <h4>Attendance Overview</h4>
            </Card.Header>
            <Card.Body>
              {classes.length === 0 ? (
                <p className="text-muted">No courses to display attendance for.</p>
              ) : (
                <div>
                  <h5>Overall Attendance</h5>
                  {Object.keys(attendanceSummary).length > 0 ? (
                    <div>
                      {classes.map((cls) => (
                        <div key={cls.id} className="mb-3">
                          <div className="d-flex justify-content-between">
                            <span>{cls.courseCode}: {cls.courseTitle}</span>
                            <span>{attendanceSummary[cls.id]?.attendancePercentage || 0}%</span>
                          </div>
                          <ProgressBar 
                            now={attendanceSummary[cls.id]?.attendancePercentage || 0} 
                            variant={
                              (attendanceSummary[cls.id]?.attendancePercentage || 0) >= 75 ? 'success' :
                              (attendanceSummary[cls.id]?.attendancePercentage || 0) >= 60 ? 'warning' : 'danger'
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No attendance data available.</p>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h4>Upcoming Classes</h4>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">No upcoming classes to display.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard;
