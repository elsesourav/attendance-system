import { config } from "dotenv";
import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";

// Load env vars
config({ path: ".env.local" });

async function initializeDatabase() {
   let connection;
   try {
      connection = await mysql.createConnection({
         host: process.env.MYSQL_HOST,
         user: process.env.MYSQL_USER,
         password: process.env.MYSQL_PASSWORD,
         multipleStatements: true,
      });

      console.log("Connected to MySQL server");

      const sqlFilePath = path.join(process.cwd(), "database.sql");
      const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

      // Execute SQL script
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
