const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { verifyToken, isTeacher } = require('../middleware/auth');

// Get attendance records for a class on a specific date
router.get('/class/:classId/date/:date', verifyToken, async (req, res) => {
  try {
    const { classId, date } = req.params;
    
    // Check if class exists and user has access
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
    );
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // If user is a teacher, check if they teach this class
    if (req.user.role === 'teacher' && req.user.id !== classes[0].teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // If user is a student, check if they are enrolled in this class
    if (req.user.role === 'student') {
      const [enrollments] = await pool.query(
        'SELECT * FROM enrollments WHERE class_id = ? AND student_id = ?',
        [classId, req.user.id]
      );
      
      if (enrollments.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    // Get attendance records
    const [attendanceRecords] = await pool.query(`
      SELECT a.*, u.full_name as student_name, r.full_name as recorded_by_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN users r ON a.recorded_by = r.id
      WHERE a.class_id = ? AND a.date = ?
    `, [classId, date]);
    
    res.json({
      success: true,
      attendance: attendanceRecords.map(record => ({
        id: record.id,
        classId: record.class_id,
        studentId: record.student_id,
        studentName: record.student_name,
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        recordedBy: record.recorded_by,
        recordedByName: record.recorded_by_name,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }))
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching attendance records'
    });
  }
});

// Get attendance records for a student in a class
router.get('/class/:classId/student/:studentId', verifyToken, async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    
    // Check if class exists
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
    );
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // Check if user has access
    if (req.user.role === 'teacher' && req.user.id !== classes[0].teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get attendance records
    const [attendanceRecords] = await pool.query(`
      SELECT a.*, u.full_name as student_name, r.full_name as recorded_by_name
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      JOIN users r ON a.recorded_by = r.id
      WHERE a.class_id = ? AND a.student_id = ?
      ORDER BY a.date DESC
    `, [classId, studentId]);
    
    // Calculate attendance statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateCount = attendanceRecords.filter(record => record.status === 'late').length;
    const excusedCount = attendanceRecords.filter(record => record.status === 'excused').length;
    
    const attendancePercentage = totalClasses > 0 
      ? ((presentCount + lateCount) / totalClasses * 100).toFixed(2) 
      : 0;
    
    res.json({
      success: true,
      attendance: attendanceRecords.map(record => ({
        id: record.id,
        classId: record.class_id,
        studentId: record.student_id,
        studentName: record.student_name,
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        recordedBy: record.recorded_by,
        recordedByName: record.recorded_by_name,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      })),
      statistics: {
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage
      }
    });
  } catch (error) {
    console.error('Get student attendance records error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching attendance records'
    });
  }
});

// Record attendance (teacher only)
router.post('/record', verifyToken, isTeacher, async (req, res) => {
  try {
    const { classId, date, records } = req.body;
    
    // Validate input
    if (!classId || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, date, and attendance records are required'
      });
    }
    
    // Check if class exists and teacher is authorized
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
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
    
    // Record attendance for each student
    for (const record of records) {
      const { studentId, status, remarks } = record;
      
      // Validate status
      if (!['present', 'absent', 'late', 'excused'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance status'
        });
      }
      
      try {
        // Check if record already exists
        const [existingRecords] = await pool.query(
          'SELECT * FROM attendance WHERE class_id = ? AND student_id = ? AND date = ?',
          [classId, studentId, date]
        );
        
        if (existingRecords.length > 0) {
          // Update existing record
          await pool.query(
            'UPDATE attendance SET status = ?, remarks = ?, recorded_by = ? WHERE id = ?',
            [status, remarks, req.user.id, existingRecords[0].id]
          );
        } else {
          // Insert new record
          await pool.query(
            'INSERT INTO attendance (class_id, student_id, date, status, remarks, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [classId, studentId, date, status, remarks, req.user.id]
          );
        }
      } catch (err) {
        console.error('Error recording attendance:', err);
        // Continue with other records even if one fails
      }
    }
    
    res.json({
      success: true,
      message: 'Attendance recorded successfully'
    });
  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while recording attendance'
    });
  }
});

// Get attendance report for a class
router.get('/report/class/:classId', verifyToken, async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Check if class exists and user has access
    const [classes] = await pool.query(
      'SELECT * FROM classes WHERE id = ?',
      [classId]
    );
    
    if (classes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    
    // If user is a teacher, check if they teach this class
    if (req.user.role === 'teacher' && req.user.id !== classes[0].teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get all students in the class
    const [students] = await pool.query(`
      SELECT u.id, u.full_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
    `, [classId]);
    
    // Get all attendance dates for this class
    const [dates] = await pool.query(`
      SELECT DISTINCT date
      FROM attendance
      WHERE class_id = ?
      ORDER BY date
    `, [classId]);
    
    // Get attendance summary for each student
    const studentReports = [];
    
    for (const student of students) {
      const [attendanceRecords] = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM attendance
        WHERE class_id = ? AND student_id = ?
        GROUP BY status
      `, [classId, student.id]);
      
      const totalClasses = dates.length;
      const presentCount = attendanceRecords.find(r => r.status === 'present')?.count || 0;
      const absentCount = attendanceRecords.find(r => r.status === 'absent')?.count || 0;
      const lateCount = attendanceRecords.find(r => r.status === 'late')?.count || 0;
      const excusedCount = attendanceRecords.find(r => r.status === 'excused')?.count || 0;
      
      const attendancePercentage = totalClasses > 0 
        ? ((presentCount + lateCount) / totalClasses * 100).toFixed(2) 
        : 0;
      
      studentReports.push({
        studentId: student.id,
        studentName: student.full_name,
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage
      });
    }
    
    res.json({
      success: true,
      classId,
      totalDates: dates.length,
      dates: dates.map(d => d.date),
      studentReports
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while generating attendance report'
    });
  }
});

module.exports = router;
