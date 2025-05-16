# Attendance System

A comprehensive attendance management system built with Next.js, MySQL, Shadcn UI, and Tailwind CSS.

## Features

-  **User Authentication**: Separate login for teachers and students
-  **Teacher Dashboard**: Create and manage streams, subjects, and track student attendance
-  **Student Dashboard**: View enrolled streams, subjects, and attendance records
-  **Attendance Tracking**: Mark and view attendance for each subject

## Tech Stack

-  **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
-  **Backend**: Next.js API Routes
-  **Database**: MySQL
-  **Authentication**: NextAuth.js
-  **Styling**: Tailwind CSS, Shadcn UI components

## Prerequisites

-  Node.js (v18 or higher)
-  MySQL server

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd attendance-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory with the following variables:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=attendance_system
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Initialize the database

```bash
npm run init-db
```

This will create the database and tables defined in `database.sql`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Sample Credentials

### Teachers

-  Email: teacher1@example.com
-  Password: password

### Students

-  Email: student1@example.com
-  Password: password
