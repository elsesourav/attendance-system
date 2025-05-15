import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Alert, Row, Col, Button, ProgressBar } from 'react-bootstrap';
import { classService, attendanceService } from '../../services/api';

const StudentAttendance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [classDetails, setClassDetails] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          throw new Error('User not found');
        }
        
        // Fetch class details
        const classResponse = await classService.getClassById(classId);
        if (!classResponse.success) {
          throw new Error(classResponse.message || 'Failed to fetch class details');
        }
        
        setClassDetails(classResponse.class);
        
        // Fetch attendance records
        const attendanceResponse = await attendanceService.getStudentAttendance(classId, user.id);
        if (!attendanceResponse.success) {
          throw new Error(attendanceResponse.message || 'Failed to fetch attendance records');
        }
        
        setAttendanceRecords(attendanceResponse.attendance);
        setStatistics(attendanceResponse.statistics);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'present':
        return 'bg-success';
      case 'absent':
        return 'bg-danger';
      case 'late':
        return 'bg-warning';
      case 'excused':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Attendance Records</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {classDetails && (
        <>
          <Card className="mb-4">
            <Card.Header>
              <h4>{classDetails.courseCode}: {classDetails.courseTitle}</h4>
              <div className="text-muted">
                {classDetails.semester} {classDetails.academicYear}
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Teacher:</strong> {classDetails.teacherName}</p>
                  <p><strong>Start Date:</strong> {new Date(classDetails.startDate).toLocaleDateString()}</p>
                  <p><strong>End Date:</strong> {new Date(classDetails.endDate).toLocaleDateString()}</p>
                </Col>
                
                {statistics && (
                  <Col md={6}>
                    <h5>Attendance Summary</h5>
                    <p><strong>Total Classes:</strong> {statistics.totalClasses}</p>
                    <p><strong>Attendance Rate:</strong> {statistics.attendancePercentage}%</p>
                    <ProgressBar 
                      now={statistics.attendancePercentage} 
                      label={`${statistics.attendancePercentage}%`}
                      variant={
                        statistics.attendancePercentage >= 75 ? 'success' :
                        statistics.attendancePercentage >= 60 ? 'warning' : 'danger'
                      }
                      className="mb-3"
                    />
                    <div className="d-flex justify-content-between">
                      <span><strong>Present:</strong> {statistics.presentCount}</span>
                      <span><strong>Absent:</strong> {statistics.absentCount}</span>
                      <span><strong>Late:</strong> {statistics.lateCount}</span>
                      <span><strong>Excused:</strong> {statistics.excusedCount}</span>
                    </div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h4>Attendance Records</h4>
            </Card.Header>
            <Card.Body>
              {attendanceRecords.length === 0 ? (
                <p className="text-center">No attendance records found for this class.</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td>{record.remarks || '-'}</td>
                        <td>{record.recordedByName}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              
              <div className="text-center mt-3">
                <Button variant="secondary" onClick={() => navigate('/student')}>
                  Back to Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentAttendance;
