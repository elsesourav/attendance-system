const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, role, created_at FROM users'
    );
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users'
    });
  }
});

// Get users by role (admin only)
router.get('/role/:role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    const [users] = await pool.query(
      'SELECT id, username, email, full_name, role, created_at FROM users WHERE role = ?',
      [role]
    );
    
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching users'
    });
  }
});

// Create new user (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;
    
    // Validate input
    if (!username || !password || !email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    // Check if username or email already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, email, fullName, role]
    );
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating user'
    });
  }
});

// Update user (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, role } = req.body;
    
    // Validate input
    if (!email || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, full name, and role are required'
      });
    }
    
    // Validate role
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }
    
    // Update user
    await pool.query(
      'UPDATE users SET email = ?, full_name = ?, role = ? WHERE id = ?',
      [email, fullName, role, id]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating user'
    });
  }
});

module.exports = router;
