-- Create the database
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create streams/classes table
CREATE TABLE IF NOT EXISTS streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create student-stream enrollment table
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  stream_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
  UNIQUE KEY (student_id, stream_id)
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  stream_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
  UNIQUE KEY (student_id, stream_id, date)
);

-- Insert sample data (optional)
-- Sample teachers
INSERT INTO users (name, email, password, role) VALUES 
('Teacher One', 'teacher1@example.com', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'teacher'),
('Teacher Two', 'teacher2@example.com', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'teacher');

-- Sample students
INSERT INTO users (name, email, password, role) VALUES 
('Student One', 'student1@example.com', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student'),
('Student Two', 'student2@example.com', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student'),
('Student Three', 'student3@example.com', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student');

-- Note: The password hash above is for 'password123'
