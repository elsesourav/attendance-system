-- Database schema for attendance system

-- Users table (for all types of users)
CREATE TABLE IF NOT EXISTS users (
   id INT AUTO_INCREMENT PRIMARY KEY,
   username VARCHAR(50) NOT NULL UNIQUE,
   password VARCHAR(255) NOT NULL,
   email VARCHAR(100) NOT NULL UNIQUE,
   full_name VARCHAR(100) NOT NULL,
   role ENUM('admin', 'teacher', 'student') NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
   id INT AUTO_INCREMENT PRIMARY KEY,
   name VARCHAR(100) NOT NULL UNIQUE,
   description TEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
   id INT AUTO_INCREMENT PRIMARY KEY,
   course_code VARCHAR(20) NOT NULL UNIQUE,
   title VARCHAR(100) NOT NULL,
   description TEXT,
   department_id INT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Classes table (specific instances of courses)
CREATE TABLE IF NOT EXISTS classes (
   id INT AUTO_INCREMENT PRIMARY KEY,
   course_id INT NOT NULL,
   teacher_id INT NOT NULL,
   semester VARCHAR(20) NOT NULL,
   academic_year VARCHAR(10) NOT NULL,
   start_date DATE NOT NULL,
   end_date DATE NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
   FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Class enrollments (students in classes)
CREATE TABLE IF NOT EXISTS enrollments (
   id INT AUTO_INCREMENT PRIMARY KEY,
   class_id INT NOT NULL,
   student_id INT NOT NULL,
   enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
   FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
   UNIQUE KEY (class_id, student_id)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
   id INT AUTO_INCREMENT PRIMARY KEY,
   class_id INT NOT NULL,
   student_id INT NOT NULL,
   date DATE NOT NULL,
   status ENUM('present', 'absent', 'late', 'excused') NOT NULL DEFAULT 'absent',
   remarks TEXT,
   recorded_by INT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
   FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
   FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
   FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE,
   UNIQUE KEY (class_id, student_id, date)
);

-- Insert sample data for testing
-- Admin user (password: admin123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('admin', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'admin@example.com', 'System Administrator', 'admin');

-- Teacher users (password: teacher123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('teacher1', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'teacher1@example.com', 'John Smith', 'teacher'),
('teacher2', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'teacher2@example.com', 'Jane Doe', 'teacher');

-- Student users (password: student123)
INSERT INTO users (username, password, email, full_name, role) VALUES
('student1', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'student1@example.com', 'Alice Johnson', 'student'),
('student2', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'student2@example.com', 'Bob Williams', 'student'),
('student3', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'student3@example.com', 'Charlie Brown', 'student'),
('student4', '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', 'student4@example.com', 'Diana Miller', 'student');

-- Sample departments
INSERT INTO departments (name, description) VALUES
('Computer Science', 'Department of Computer Science and Engineering'),
('Mathematics', 'Department of Mathematics and Statistics');

-- Sample courses
INSERT INTO courses (course_code, title, description, department_id) VALUES
('CS101', 'Introduction to Programming', 'Basic programming concepts using Python', 1),
('CS202', 'Data Structures', 'Advanced data structures and algorithms', 1),
('MATH101', 'Calculus I', 'Introduction to differential and integral calculus', 2);

-- Sample classes
INSERT INTO classes (course_id, teacher_id, semester, academic_year, start_date, end_date) VALUES
(1, 2, 'Fall', '2023-2024', '2023-09-01', '2023-12-15'),
(2, 2, 'Spring', '2023-2024', '2024-01-15', '2024-05-30'),
(3, 3, 'Fall', '2023-2024', '2023-09-01', '2023-12-15');

-- Sample enrollments
INSERT INTO enrollments (class_id, student_id) VALUES
(1, 4), (1, 5), (1, 6), (1, 7),  -- All students in CS101
(2, 4), (2, 5),                  -- Alice and Bob in CS202
(3, 6), (3, 7);                  -- Charlie and Diana in MATH101

-- Sample attendance records
INSERT INTO attendance (class_id, student_id, date, status, recorded_by) VALUES
(1, 4, '2023-09-05', 'present', 2),
(1, 5, '2023-09-05', 'present', 2),
(1, 6, '2023-09-05', 'absent', 2),
(1, 7, '2023-09-05', 'present', 2),
(1, 4, '2023-09-07', 'present', 2),
(1, 5, '2023-09-07', 'late', 2),
(1, 6, '2023-09-07', 'present', 2),
(1, 7, '2023-09-07', 'excused', 2);
