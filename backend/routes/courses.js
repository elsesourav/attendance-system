const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all courses
router.get('/', verifyToken, async (req, res) => {
  try {
    const [courses] = await pool.query(`
      SELECT c.*, d.name as department_name 
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
    `);
    
    res.json({
      success: true,
      courses: courses.map(course => ({
        id: course.id,
        courseCode: course.course_code,
        title: course.title,
        description: course.description,
        departmentId: course.department_id,
        departmentName: course.department_name,
        createdAt: course.created_at
      }))
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching courses'
    });
  }
});

// Get course by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [courses] = await pool.query(`
      SELECT c.*, d.name as department_name 
      FROM courses c
      LEFT JOIN departments d ON c.department_id = d.id
      WHERE c.id = ?
    `, [id]);
    
    if (courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const course = courses[0];
    
    res.json({
      success: true,
      course: {
        id: course.id,
        courseCode: course.course_code,
        title: course.title,
        description: course.description,
        departmentId: course.department_id,
        departmentName: course.department_name,
        createdAt: course.created_at
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching course'
    });
  }
});

// Create new course (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { courseCode, title, description, departmentId } = req.body;
    
    // Validate input
    if (!courseCode || !title) {
      return res.status(400).json({
        success: false,
        message: 'Course code and title are required'
      });
    }
    
    // Check if course code already exists
    const [existingCourses] = await pool.query(
      'SELECT * FROM courses WHERE course_code = ?',
      [courseCode]
    );
    
    if (existingCourses.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Course code already exists'
      });
    }
    
    // Insert new course
    const [result] = await pool.query(
      'INSERT INTO courses (course_code, title, description, department_id) VALUES (?, ?, ?, ?)',
      [courseCode, title, description, departmentId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      courseId: result.insertId
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating course'
    });
  }
});

// Update course (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, departmentId } = req.body;
    
    // Validate input
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    // Update course
    await pool.query(
      'UPDATE courses SET title = ?, description = ?, department_id = ? WHERE id = ?',
      [title, description, departmentId, id]
    );
    
    res.json({
      success: true,
      message: 'Course updated successfully'
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating course'
    });
  }
});

// Get departments
router.get('/departments/all', verifyToken, async (req, res) => {
  try {
    const [departments] = await pool.query('SELECT * FROM departments');
    
    res.json({
      success: true,
      departments: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        createdAt: dept.created_at
      }))
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching departments'
    });
  }
});

module.exports = router;
