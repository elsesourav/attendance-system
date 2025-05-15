const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
// Use SQLite database instead of MySQL
const { testConnection, initializeDatabase } = require("./config/db_sqlite");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const classRoutes = require("./routes/classes");
const attendanceRoutes = require("./routes/attendance");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);

// Root route
app.get("/", (req, res) => {
   res.json({ message: "Welcome to the Attendance System API" });
});

// Start server
app.listen(PORT, async () => {
   console.log(`Server is running on port ${PORT}`);

   // Initialize database and test connection
   await initializeDatabase();
   await testConnection();
});

// Error handling middleware
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
   });
});
