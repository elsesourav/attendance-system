import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Table, Alert, Row, Col } from 'react-bootstrap';
import { classService, attendanceService } from '../../services/api';

const TakeAttendance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  const [classDetails, setClassDetails] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [existingRecords, setExistingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await classService.getClassById(classId);
        if (response.success) {
          setClassDetails(response.class);
          
          // Initialize attendance records for all students
          const initialRecords = response.class.students.map(student => ({
            studentId: student.id,
            studentName: student.fullName,
            status: 'present',
            remarks: ''
          }));
          
          setAttendanceRecords(initialRecords);
        } else {
          throw new Error(response.message || 'Failed to fetch class details');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching class details');
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    // Fetch existing attendance records when date changes
    const fetchExistingAttendance = async () => {
      if (!date || !classId) return;
      
      try {
        setLoading(true);
        const response = await attendanceService.getAttendanceByClassAndDate(classId, date);
        
        if (response.success) {
          setExistingRecords(response.attendance);
          
          // Update attendance records with existing data
          if (response.attendance.length > 0 && attendanceRecords.length > 0) {
            const updatedRecords = [...attendanceRecords];
            
            response.attendance.forEach(record => {
              const index = updatedRecords.findIndex(r => r.studentId === record.studentId);
              if (index !== -1) {
                updatedRecords[index].status = record.status;
                updatedRecords[index].remarks = record.remarks || '';
              }
            });
            
            setAttendanceRecords(updatedRecords);
          }
        }
      } catch (err) {
        console.error('Error fetching existing attendance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingAttendance();
  }, [date, classId, attendanceRecords.length]);

  const handleStatusChange = (studentId, status) => {
    const updatedRecords = attendanceRecords.map(record => {
      if (record.studentId === studentId) {
        return { ...record, status };
      }
      return record;
    });
    
    setAttendanceRecords(updatedRecords);
  };

  const handleRemarksChange = (studentId, remarks) => {
    const updatedRecords = attendanceRecords.map(record => {
      if (record.studentId === studentId) {
        return { ...record, remarks };
      }
      return record;
    });
    
    setAttendanceRecords(updatedRecords);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    
    try {
      const attendanceData = {
        classId: parseInt(classId),
        date,
        records: attendanceRecords
      };
      
      const response = await attendanceService.recordAttendance(attendanceData);
      
      if (response.success) {
        setSuccess('Attendance recorded successfully');
        // Wait 2 seconds before navigating back
        setTimeout(() => {
          navigate(`/teacher/class/${classId}`);
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to record attendance');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while recording attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !classDetails) {
    return <div className="text-center mt-5">Loading class details...</div>;
  }

  return (
    <div>
      <h2 className="mb-4">Take Attendance</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {classDetails && (
        <Card className="mb-4">
          <Card.Header>
            <h4>{classDetails.courseCode}: {classDetails.courseTitle}</h4>
            <div className="text-muted">
              {classDetails.semester} {classDetails.academicYear}
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record) => (
                    <tr key={record.studentId}>
                      <td>{record.studentName}</td>
                      <td>
                        <Form.Select
                          value={record.status}
                          onChange={(e) => handleStatusChange(record.studentId, e.target.value)}
                          required
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Optional remarks"
                          value={record.remarks}
                          onChange={(e) => handleRemarksChange(record.studentId, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={() => navigate(`/teacher/class/${classId}`)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Attendance'}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default TakeAttendance;
