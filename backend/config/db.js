const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool without specifying a database
const pool = mysql.createPool({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
});

// Function to initialize the database
async function initializeDatabase() {
   try {
      // Create a connection without specifying a database
      const connection = await pool.getConnection();

      // Create the database if it doesn't exist
      await connection.query(
         `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
      );

      // Use the database
      await connection.query(`USE ${process.env.DB_NAME}`);

      // Import schema from SQL file
      const fs = require("fs");
      const path = require("path");
      const sqlFilePath = path.join(__dirname, "..", "database.sql");

      if (fs.existsSync(sqlFilePath)) {
         const sqlScript = fs.readFileSync(sqlFilePath, "utf8");

         // Split the SQL script into individual statements
         const statements = sqlScript
            .split(";")
            .filter((statement) => statement.trim() !== "");

         // Execute each statement
         for (const statement of statements) {
            if (statement.trim()) {
               await connection.query(statement);
            }
         }

         console.log("Database schema imported successfully");
      } else {
         console.error("SQL file not found:", sqlFilePath);
      }

      connection.release();
      return true;
   } catch (error) {
      console.error("Database initialization failed:", error);
      return false;
   }
}

// Test database connection
async function testConnection() {
   try {
      const connection = await pool.getConnection();
      console.log("Database connection established successfully");
      connection.release();
      return true;
   } catch (error) {
      console.error("Database connection failed:", error);
      return false;
   }
}

module.exports = {
   pool,
   testConnection,
   initializeDatabase,
};
