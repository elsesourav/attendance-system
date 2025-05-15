const fs = require("fs");
const readline = require("readline");
const path = require("path");

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout,
});

// Path to .env file
const envFilePath = path.join(__dirname, "backend", ".env");

// Read the current .env file
fs.readFile(envFilePath, "utf8", (err, data) => {
   if (err) {
      console.error("Error reading .env file:", err);
      rl.close();
      return;
   }

   rl.question("Enter your MySQL root password: ", (password) => {
      // Replace the DB_PASSWORD line
      const updatedData = data.replace(
         /DB_PASSWORD=.*/,
         `DB_PASSWORD=${password}`
      );

      // Write the updated content back to the .env file
      fs.writeFile(envFilePath, updatedData, "utf8", (err) => {
         if (err) {
            console.error("Error writing to .env file:", err);
         } else {
            console.log("MySQL password updated successfully in .env file");
         }
         rl.close();
      });
   });
});
