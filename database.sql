-- Updated database schema for the attendance system
-- This file combines the original schema and migrations

DROP DATABASE IF EXISTS attendance_system;

-- Create the database
CREATE DATABASE IF NOT EXISTS attendance_system;
USE attendance_system;

-- Create users table with additional fields
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile_number VARCHAR(20),
  registration_number VARCHAR(50),
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

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  stream_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE
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

-- Create subject enrollments table
CREATE TABLE IF NOT EXISTS subject_enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY (student_id, subject_id)
);

-- Create attendance records table with subject support
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  stream_id INT NOT NULL,
  subject_id INT,
  status ENUM('present', 'absent', 'late') NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY (student_id, stream_id, subject_id, date)
);

-- Insert sample data (optional)
-- Sample teachers
INSERT INTO users (name, email, mobile_number, password, role) VALUES 
('Teacher One', 'teacher1@example.com', '9876543210', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'teacher'),
('Teacher Two', 'teacher2@example.com', '9876543211', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'teacher');

-- Sample students
INSERT INTO users (name, email, mobile_number, registration_number, password, role) VALUES 
('Student One', 'student1@example.com', '9876543212', 'REG001', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student'),
('Student Two', 'student2@example.com', '9876543213', 'REG002', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student'),
('Student Three', 'student3@example.com', '9876543214', 'REG003', '$2b$10$JsRJUEFgUJkEHDFDVSnSxOJySKxK2sxjqVeWQ7LqHs9JJgj3bKVdW', 'student');

-- Note: The password hash above is for 'password123'

-- Sample streams
INSERT INTO streams (name, description, teacher_id) VALUES
('Computer Science', 'B.Tech Computer Science Engineering', 1),
('Electronics', 'B.Tech Electronics Engineering', 2);

-- Sample subjects
INSERT INTO subjects (name, description, stream_id) VALUES
('Data Structures', 'Study of data structures and algorithms', 1),
('Algorithms', 'Design and analysis of algorithms', 1),
('Database Systems', 'Introduction to database management systems', 1),
('Digital Electronics', 'Fundamentals of digital electronics', 2),
('Microprocessors', 'Architecture and programming of microprocessors', 2);

-- Sample enrollments
INSERT INTO enrollments (student_id, stream_id) VALUES
(3, 1), -- Student One in Computer Science
(4, 1), -- Student Two in Computer Science
(5, 2); -- Student Three in Electronics

-- Sample subject enrollments
INSERT INTO subject_enrollments (student_id, subject_id) VALUES
(3, 1), -- Student One in Data Structures
(3, 2), -- Student One in Algorithms
(4, 1), -- Student Two in Data Structures
(4, 3), -- Student Two in Database Systems
(5, 4), -- Student Three in Digital Electronics
(5, 5); -- Student Three in Microprocessors

-- Migration script for existing databases
-- Run these commands if you're upgrading from the old schema

-- If you're upgrading an existing database, uncomment and run these commands:
/*
-- Add mobile_number and registration_number to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20) AFTER email;
ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50) AFTER mobile_number;

-- Add subject_id to attendance table if it doesn't exist
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS subject_id INT AFTER stream_id;
ALTER TABLE attendance ADD FOREIGN KEY IF NOT EXISTS (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

-- Update the unique key in attendance table
ALTER TABLE attendance DROP INDEX IF EXISTS student_id_stream_id_date;
ALTER TABLE attendance ADD UNIQUE KEY (student_id, stream_id, subject_id, date);
*/
