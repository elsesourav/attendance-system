const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { models } = require("../config/db_sqlite");
const { verifyToken } = require("../middleware/auth");

// Login route
router.post("/login", async (req, res) => {
   try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
         return res.status(400).json({
            success: false,
            message: "Username and password are required",
         });
      }

      // Check if user exists
      const user = await models.User.findOne({
         where: { username },
      });

      if (!user) {
         return res.status(401).json({
            success: false,
            message: "Invalid username or password",
         });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
         return res.status(401).json({
            success: false,
            message: "Invalid username or password",
         });
      }

      // Generate JWT token
      const token = jwt.sign(
         {
            id: user.id,
            username: user.username,
            role: user.role,
         },
         process.env.JWT_SECRET,
         { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Return user info and token
      res.json({
         success: true,
         message: "Login successful",
         user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
         },
         token,
      });
   } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
         success: false,
         message: "An error occurred during login",
      });
   }
});

// Get current user info
router.get("/me", verifyToken, async (req, res) => {
   try {
      const user = await models.User.findByPk(req.user.id, {
         attributes: ["id", "username", "email", "full_name", "role"],
      });

      if (!user) {
         return res.status(404).json({
            success: false,
            message: "User not found",
         });
      }
      res.json({
         success: true,
         user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
         },
      });
   } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
         success: false,
         message: "An error occurred while fetching user data",
      });
   }
});

module.exports = router;
