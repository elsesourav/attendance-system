#!/bin/bash

# Reset the attendance system database
echo "Resetting the attendance system database..."
mysql -u root < database.sql

# Check if the reset was successful
if [ $? -eq 0 ]; then
    echo "Database reset successful!"
    echo "The attendance system database has been recreated with the new schema."
    echo "You can now run the application with: npm run dev"
else
    echo "Error: Database reset failed."
    echo "Please check your MySQL connection and try again."
fi
