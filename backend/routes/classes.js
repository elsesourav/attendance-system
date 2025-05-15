const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isTeacher, isAdmin } = require('../middleware/auth');

// Get all classes
router.get('/', verifyToken, async (req, res) => {
  try {
    const [classes] = await pool.query(`
      SELECT c.*, co.course_code, co.title as course_title, 
             u.full_name as teacher_name
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.teacher_id = u.id
    `);
    
    res.json({
      success: true,
      classes: classes.map(cls => ({
        id: cls.id,
        courseId: cls.course_id,
        courseCode: cls.course_code,
        courseTitle: cls.course_title,
        teacherId: cls.teacher_id,
        teacherName: cls.teacher_name,
        semester: cls.semester,
        academicYear: cls.academic_year,
        startDate: cls.start_date,
        endDate: cls.end_date,
        createdAt: cls.created_at
      }))
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching classes'
    });
  }
});

// Get classes by teacher ID
router.get('/teacher/:teacherId', verifyToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // If not admin and not the teacher, deny access
    if (req.user.role !== 'admin' && req.user.id !== parseInt(teacherId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const [classes] = await pool.query(`
      SELECT c.*, co.course_code, co.title as course_title, 
             u.full_name as teacher_name
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.teacher_id = ?
    `, [teacherId]);
    
    res.json({
      success: true,
      classes: classes.map(cls => ({
        id: cls.id,
        courseId: cls.course_id,
        courseCode: cls.course_code,
        courseTitle: cls.course_title,
        teacherId: cls.teacher_id,
        teacherName: cls.teacher_name,
        semester: cls.semester,
        academicYear: cls.academic_year,
        startDate: cls.start_date,
        endDate: cls.end_date,
        createdAt: cls.created_at
      }))
    });
  } catch (error) {
    console.error('Get teacher classes error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching classes'
    });
  }
});

// Get classes by student ID (enrolled classes)
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // If not admin and not the student, deny access
    if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const [classes] = await pool.query(`
      SELECT c.*, co.course_code, co.title as course_title, 
             u.full_name as teacher_name, e.enrollment_date
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ?
    `, [studentId]);
    
    res.json({
      success: true,
      classes: classes.map(cls => ({
        id: cls.id,
        courseId: cls.course_id,
        courseCode: cls.course_code,
        courseTitle: cls.course_title,
        teacherId: cls.teacher_id,
        teacherName: cls.teacher_name,
        semester: cls.semester,
        academicYear: cls.academic_year,
        startDate: cls.start_date,
        endDate: cls.end_date,
        enrollmentDate: cls.enrollment_date,
        createdAt: cls.created_at
      }))
    });
  } catch (error) {
    console.error('Get student classes error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching classes'
    });
  }
});

// Get class details by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [classes] = await pool.query(`
      SELECT c.*, co.course_code, co.title as course_title, 
             u.full_name as teacher_name
      FROM classes c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [id]);
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    const cls = classes[0];
    
    // Get enrolled students
    const [students] = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.email, e.enrollment_date
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
    `, [id]);
    
    res.json({
      success: true,
      class: {
        id: cls.id,
        courseId: cls.course_id,
        courseCode: cls.course_code,
        courseTitle: cls.course_title,
        teacherId: cls.teacher_id,
        teacherName: cls.teacher_name,
        semester: cls.semester,
        academicYear: cls.academic_year,
        startDate: cls.start_date,
        endDate: cls.end_date,
        createdAt: cls.created_at,
        students: students.map(student => ({
          id: student.id,
          username: student.username,
          fullName: student.full_name,
          email: student.email,
          enrollmentDate: student.enrollment_date
        }))
      }
    });
  } catch (error) {
    console.error('Get class details error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching class details'
    });
  }
});

// Create new class (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseId, teacherId, semester, academicYear, startDate, endDate } = req.body;
    
    // Validate input
    if (!courseId || !teacherId || !semester || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Insert new class
    const [result] = await pool.query(
      'INSERT INTO classes (course_id, teacher_id, semester, academic_year, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
      [courseId, teacherId, semester, academicYear, startDate, endDate]
    );
    
    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      classId: result.insertId
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating class'
    });
  }
});

// Enroll students in a class (admin or teacher)
router.post('/:id/enroll', verifyToken, isTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;
    
    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Student IDs array is required'
      });
    }
    
    // Check if class exists and teacher is authorized
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [id]
    );
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // If not admin and not the teacher of this class, deny access
    if (req.user.role !== 'admin' && req.user.id !== classes[0].teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Enroll students
    for (const studentId of studentIds) {
      try {
        await pool.query(
          'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)',
          [id, studentId]
        );
      } catch (err) {
        // Ignore duplicate entry errors
        if (err.code !== 'ER_DUP_ENTRY') {
          throw err;
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Students enrolled successfully'
    });
  } catch (error) {
    console.error('Enroll students error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while enrolling students'
    });
  }
});

module.exports = router;
