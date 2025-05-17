DROP DATABASE IF EXISTS attendance_system;

CREATE DATABASE IF NOT EXISTS attendance_system;

USE attendance_system;

CREATE TABLE
   IF NOT EXISTS teachers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile_number VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

CREATE TABLE
   IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile_number VARCHAR(20) NOT NULL,
      registration_number VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );

CREATE TABLE
   IF NOT EXISTS streams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      teacher_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS subjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      stream_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (stream_id) REFERENCES streams (id) ON DELETE CASCADE
   );

CREATE TABLE
   IF NOT EXISTS subject_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      subject_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
      UNIQUE KEY (student_id, subject_id)
   );

CREATE TABLE
   IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id INT NOT NULL,
      subject_id INT NOT NULL,
      status ENUM ("present", "absent", "late") NOT NULL,
      date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
      UNIQUE KEY (student_id, subject_id, date)
   );

INSERT INTO
   teachers (name, email, mobile_number, password)
VALUES
   (
      "Teacher One",
      "teacher1@example.com",
      "9876543210",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   ),
   (
      "Teacher Two",
      "teacher2@example.com",
      "9876543211",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   );

INSERT INTO
   students (
      name,
      email,
      mobile_number,
      registration_number,
      password
   )
VALUES
   (
      "Student One",
      "student1@example.com",
      "9876543212",
      "REG001",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   ),
   (
      "Student Two",
      "student2@example.com",
      "9876543213",
      "REG002",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   ),
   (
      "Student Three",
      "student3@example.com",
      "9876543214",
      "REG003",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   ),
   (
      "Student Four",
      "student4@example.com",
      "9876543215",
      "REG004",
      "$2b$10$4UhhhoC46Xd.MDwK4neD0Oc33tsHdGREE84qj3DwRPBcjY9zZty9S"
   );

-- INSERT INTO
--    streams (name, description, teacher_id)
-- VALUES
--    (
--       "Computer Science",
--       "Bachelor of Computer Science program",
--       1
--    ),
--    (
--       "Engineering",
--       "Bachelor of Engineering program",
--       2
--    );

-- INSERT INTO
--    subjects (name, description, stream_id)
-- VALUES
--    (
--       "Database Systems",
--       "Introduction to database design and SQL",
--       1
--    ),
--    (
--       "Web Development",
--       "Full-stack web application development",
--       1
--    ),
--    (
--       "Mechanics",
--       "Engineering mechanics and dynamics",
--       2
--    );

-- INSERT INTO
--    subject_enrollments (student_id, subject_id)
-- VALUES
--    (1, 1),
--    (1, 2),
--    (2, 2),
--    (3, 3);

-- INSERT INTO
--    attendance (student_id, subject_id, status, date)
-- VALUES
--    (1, 1, "present", "2023-05-01"),
--    (1, 1, "present", "2023-05-08"),
--    (1, 1, "absent", "2023-05-15"),
--    (1, 2, "present", "2023-05-02"),
--    (1, 2, "late", "2023-05-09"),
--    (2, 2, "present", "2023-05-02"),
--    (2, 2, "present", "2023-05-09"),
--    (3, 3, "present", "2023-05-03"),
--    (3, 3, "absent", "2023-05-10");