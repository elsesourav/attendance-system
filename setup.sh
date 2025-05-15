#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Attendance System Setup${NC}"
echo "=============================="
echo

# Ask for MySQL credentials
echo -e "${YELLOW}MySQL Database Setup${NC}"
echo "Please enter your MySQL credentials:"
read -p "Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -s -p "Password: " DB_PASSWORD
echo

# Update .env file
echo -e "\n${YELLOW}Updating environment variables...${NC}"
sed -i '' "s/DB_USER=.*/DB_USER=$DB_USER/" backend/.env
sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" backend/.env

echo -e "${GREEN}Environment variables updated successfully!${NC}"

# Create database and import schema
echo -e "\n${YELLOW}Creating database and importing schema...${NC}"
echo "This will create the 'attendance_system' database and import the schema."
echo "If the database already exists, it will be dropped and recreated."
read -p "Continue? (y/n): " CONTINUE

if [ "$CONTINUE" != "y" ]; then
    echo -e "${RED}Setup aborted.${NC}"
    exit 1
fi

# Create database and import schema
mysql -u $DB_USER -p$DB_PASSWORD -e "DROP DATABASE IF EXISTS attendance_system; CREATE DATABASE attendance_system;"
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create database. Please check your MySQL credentials.${NC}"
    exit 1
fi

mysql -u $DB_USER -p$DB_PASSWORD attendance_system < backend/database.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import schema. Please check your MySQL credentials.${NC}"
    exit 1
fi

echo -e "${GREEN}Database setup completed successfully!${NC}"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
echo "This will install dependencies for both backend and frontend."
read -p "Continue? (y/n): " CONTINUE

if [ "$CONTINUE" != "y" ]; then
    echo -e "${RED}Dependency installation skipped.${NC}"
else
    echo "Installing backend dependencies..."
    cd backend && npm install
    
    echo "Installing frontend dependencies..."
    cd ../frontend && npm install
    
    echo -e "${GREEN}Dependencies installed successfully!${NC}"
fi

echo -e "\n${GREEN}Setup completed!${NC}"
echo "To start the backend server: cd backend && npm run dev"
echo "To start the frontend server: cd frontend && npm run dev"
echo "Access the application at http://localhost:5173"
echo
echo "Demo credentials:"
echo "Admin: username: admin, password: admin123"
echo "Teacher: username: teacher1, password: teacher123"
echo "Student: username: student1, password: student123"
