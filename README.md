# Attendance System

A comprehensive web-based attendance management system with separate interfaces for teachers, students, and administrators.

## Features

-  **User Authentication**

   -  Separate login for teachers, students, and administrators
   -  JWT-based authentication

-  **Admin Dashboard**

   -  Manage users (teachers and students)
   -  Manage courses and departments
   -  Manage classes and enrollments
   -  View system statistics

-  **Teacher Dashboard**

   -  View assigned classes
   -  Take attendance with date selection
   -  Generate attendance reports
   -  View student attendance statistics

-  **Student Dashboard**
   -  View enrolled courses
   -  Check attendance records and statistics
   -  View attendance percentage

## Technology Stack

-  **Frontend**

   -  React.js with React Router
   -  Bootstrap for responsive UI
   -  Axios for API communication

-  **Backend**
   -  Node.js with Express
   -  JWT for authentication
   -  MySQL database

## Prerequisites

-  Node.js (v14 or higher)
-  MySQL (v8 or higher)

## Installation

### Option 1: Using the Setup Script (Recommended)

We've provided a setup script that automates the installation process:

```bash
# Make the script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The script will:

1. Ask for your MySQL credentials
2. Update the `.env` file with your credentials
3. Create the database and import the schema
4. Install dependencies for both backend and frontend

### Option 2: Manual Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/attendance-system.git
cd attendance-system
```

### 2. Set up the database

1. Create a MySQL database named `attendance_system`
2. Import the database schema from `backend/database.sql`

```bash
mysql -u root -p attendance_system < backend/database.sql
```

### 3. Configure environment variables

1. Update the `.env` file in the `backend` directory with your MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_system
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

### 4. Install dependencies and start the backend server

```bash
cd backend
npm install
npm run dev
```

### 5. Install dependencies and start the frontend server

```bash
cd ../frontend
npm install
npm run dev
```

## Usage

1. Access the application at `http://localhost:5173`
2. Log in using the following demo credentials:

-  **Admin**: username: `admin`, password: `admin123`
-  **Teacher**: username: `teacher1`, password: `teacher123`
-  **Student**: username: `student1`, password: `student123`

## API Endpoints

### Authentication

-  `POST /api/auth/login` - User login
-  `GET /api/auth/me` - Get current user info

### Users

-  `GET /api/users` - Get all users (admin only)
-  `GET /api/users/role/:role` - Get users by role (admin only)
-  `POST /api/users` - Create new user (admin only)
-  `PUT /api/users/:id` - Update user (admin only)

### Courses

-  `GET /api/courses` - Get all courses
-  `GET /api/courses/:id` - Get course by ID
-  `POST /api/courses` - Create new course (admin only)
-  `PUT /api/courses/:id` - Update course (admin only)
-  `GET /api/courses/departments/all` - Get all departments

### Classes

-  `GET /api/classes` - Get all classes
-  `GET /api/classes/:id` - Get class details by ID
-  `GET /api/classes/teacher/:teacherId` - Get classes by teacher ID
-  `GET /api/classes/student/:studentId` - Get classes by student ID
-  `POST /api/classes` - Create new class (admin only)
-  `POST /api/classes/:id/enroll` - Enroll students in a class (admin or teacher)

### Attendance

-  `GET /api/attendance/class/:classId/date/:date` - Get attendance records for a class on a specific date
-  `GET /api/attendance/class/:classId/student/:studentId` - Get attendance records for a student in a class
-  `POST /api/attendance/record` - Record attendance (teacher only)
-  `GET /api/attendance/report/class/:classId` - Get attendance report for a class

## License

MIT
