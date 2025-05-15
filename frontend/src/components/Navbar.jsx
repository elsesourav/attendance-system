import { Link } from 'react-router-dom';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';

const Navbar = ({ user, onLogout }) => {
  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">Attendance System</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                {/* Admin Links */}
                {user.role === 'admin' && (
                  <>
                    <Nav.Link as={Link} to="/admin">Dashboard</Nav.Link>
                    <Nav.Link as={Link} to="/admin/users">Users</Nav.Link>
                    <Nav.Link as={Link} to="/admin/courses">Courses</Nav.Link>
                    <Nav.Link as={Link} to="/admin/classes">Classes</Nav.Link>
                  </>
                )}
                
                {/* Teacher Links */}
                {user.role === 'teacher' && (
                  <>
                    <Nav.Link as={Link} to="/teacher">Dashboard</Nav.Link>
                  </>
                )}
                
                {/* Student Links */}
                {user.role === 'student' && (
                  <>
                    <Nav.Link as={Link} to="/student">Dashboard</Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {user ? (
              <>
                <Nav.Item className="d-flex align-items-center me-3">
                  <span className="text-light">
                    {user.fullName} ({user.role})
                  </span>
                </Nav.Item>
                <Button variant="outline-light" onClick={onLogout}>Logout</Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
