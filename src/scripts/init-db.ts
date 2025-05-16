import { config } from "dotenv";
import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function initializeDatabase() {
   let connection;
   try {
      // Create connection without database selection
      connection = await mysql.createConnection({
         host: process.env.MYSQL_HOST,
         user: process.env.MYSQL_USER,
         password: process.env.MYSQL_PASSWORD,
         multipleStatements: true, // Allow multiple statements
      });

      console.log("Connected to MySQL server");

      // Read SQL file
      const sqlFilePath = path.join(process.cwd(), "database.sql");
      const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

      // Execute the SQL script directly using query instead of execute
      // This allows multiple statements to be executed at once
      await connection.query(sqlContent);

      console.log("Database initialized successfully");
   } catch (error) {
      console.error("Error initializing database:", error);
      process.exit(1);
   } finally {
      if (connection) {
         await connection.end();
      }
   }
}

initializeDatabase();
