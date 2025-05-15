import { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { authService } from '../services/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate input
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Call login API
      const response = await authService.login(username, password);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        
        // Call the onLogin callback with user data
        onLogin(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center mt-5">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white text-center">
              <h3>Attendance System Login</h3>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="text-center text-muted">
              <div className="mt-2">
                <strong>Demo Accounts:</strong>
              </div>
              <div className="small">
                Admin: admin / admin123<br />
                Teacher: teacher1 / teacher123<br />
                Student: student1 / student123
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
