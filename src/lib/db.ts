import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
   host: process.env.MYSQL_HOST || "localhost",
   user: process.env.MYSQL_USER || "root",
   password: process.env.MYSQL_PASSWORD || "",
   database: process.env.MYSQL_DATABASE || "attendance_system",
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
});

export async function executeQuery<T>({
   query,
   values,
}: {
   query: string;
   values?: any[];
}): Promise<T> {
   try {
      const [result] = await pool.execute(query, values);
      return result as T;
   } catch (error) {
      console.error("Database query error:", error);
      throw error;
   }
}

export default pool;
