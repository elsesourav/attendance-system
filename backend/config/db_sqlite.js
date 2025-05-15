const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Create SQLite database file path
const dbPath = path.join(__dirname, '..', 'attendance_system.sqlite');

// Create Sequelize instance
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

// Define models
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  },
  full_name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('admin', 'teacher', 'student'),
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

const Department = sequelize.define('Department', {
  name: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: Sequelize.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Course = sequelize.define('Course', {
  course_code: {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: true
  },
  title: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  description: {
    type: Sequelize.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Class = sequelize.define('Class', {
  semester: {
    type: Sequelize.STRING(20),
    allowNull: false
  },
  academic_year: {
    type: Sequelize.STRING(10),
    allowNull: false
  },
  start_date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Enrollment = sequelize.define('Enrollment', {
  // No additional fields needed
}, {
  timestamps: true,
  createdAt: 'enrollment_date',
  updatedAt: false
});

const Attendance = sequelize.define('Attendance', {
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  status: {
    type: Sequelize.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: false,
    defaultValue: 'absent'
  },
  remarks: {
    type: Sequelize.TEXT
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define relationships
Department.hasMany(Course, { foreignKey: 'department_id' });
Course.belongsTo(Department, { foreignKey: 'department_id' });

Course.hasMany(Class, { foreignKey: 'course_id' });
Class.belongsTo(Course, { foreignKey: 'course_id' });

User.hasMany(Class, { foreignKey: 'teacher_id' });
Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'Teacher' });

Class.belongsToMany(User, { through: Enrollment, foreignKey: 'class_id', otherKey: 'student_id' });
User.belongsToMany(Class, { through: Enrollment, foreignKey: 'student_id', otherKey: 'class_id' });

Class.hasMany(Attendance, { foreignKey: 'class_id' });
Attendance.belongsTo(Class, { foreignKey: 'class_id' });

User.hasMany(Attendance, { foreignKey: 'student_id' });
Attendance.belongsTo(User, { foreignKey: 'student_id', as: 'Student' });

User.hasMany(Attendance, { foreignKey: 'recorded_by' });
Attendance.belongsTo(User, { foreignKey: 'recorded_by', as: 'Recorder' });

// Initialize database
async function initializeDatabase() {
  try {
    // Sync all models with database
    await sequelize.sync();
    
    // Check if we need to seed the database
    const [users] = await sequelize.query('SELECT COUNT(*) as count FROM Users');
    if (users[0].count === 0) {
      // Seed the database with initial data
      await seedDatabase();
    }
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}

// Seed the database with initial data
async function seedDatabase() {
  try {
    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // admin123
      email: 'admin@example.com',
      full_name: 'System Administrator',
      role: 'admin'
    });
    
    // Create teacher users
    const teacher1 = await User.create({
      username: 'teacher1',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // teacher123
      email: 'teacher1@example.com',
      full_name: 'John Smith',
      role: 'teacher'
    });
    
    const teacher2 = await User.create({
      username: 'teacher2',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // teacher123
      email: 'teacher2@example.com',
      full_name: 'Jane Doe',
      role: 'teacher'
    });
    
    // Create student users
    const student1 = await User.create({
      username: 'student1',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // student123
      email: 'student1@example.com',
      full_name: 'Alice Johnson',
      role: 'student'
    });
    
    const student2 = await User.create({
      username: 'student2',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // student123
      email: 'student2@example.com',
      full_name: 'Bob Williams',
      role: 'student'
    });
    
    const student3 = await User.create({
      username: 'student3',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // student123
      email: 'student3@example.com',
      full_name: 'Charlie Brown',
      role: 'student'
    });
    
    const student4 = await User.create({
      username: 'student4',
      password: '$2b$10$1JxS4BdlIpJbhXWF8Vv5eeJA1VX3OHmxH3Cd4q.ewZJLCE7MUbp0W', // student123
      email: 'student4@example.com',
      full_name: 'Diana Miller',
      role: 'student'
    });
    
    // Create departments
    const csDept = await Department.create({
      name: 'Computer Science',
      description: 'Department of Computer Science and Engineering'
    });
    
    const mathDept = await Department.create({
      name: 'Mathematics',
      description: 'Department of Mathematics and Statistics'
    });
    
    // Create courses
    const course1 = await Course.create({
      course_code: 'CS101',
      title: 'Introduction to Programming',
      description: 'Basic programming concepts using Python',
      department_id: csDept.id
    });
    
    const course2 = await Course.create({
      course_code: 'CS202',
      title: 'Data Structures',
      description: 'Advanced data structures and algorithms',
      department_id: csDept.id
    });
    
    const course3 = await Course.create({
      course_code: 'MATH101',
      title: 'Calculus I',
      description: 'Introduction to differential and integral calculus',
      department_id: mathDept.id
    });
    
    // Create classes
    const class1 = await Class.create({
      course_id: course1.id,
      teacher_id: teacher1.id,
      semester: 'Fall',
      academic_year: '2023-2024',
      start_date: '2023-09-01',
      end_date: '2023-12-15'
    });
    
    const class2 = await Class.create({
      course_id: course2.id,
      teacher_id: teacher1.id,
      semester: 'Spring',
      academic_year: '2023-2024',
      start_date: '2024-01-15',
      end_date: '2024-05-30'
    });
    
    const class3 = await Class.create({
      course_id: course3.id,
      teacher_id: teacher2.id,
      semester: 'Fall',
      academic_year: '2023-2024',
      start_date: '2023-09-01',
      end_date: '2023-12-15'
    });
    
    // Create enrollments
    await Enrollment.create({ class_id: class1.id, student_id: student1.id });
    await Enrollment.create({ class_id: class1.id, student_id: student2.id });
    await Enrollment.create({ class_id: class1.id, student_id: student3.id });
    await Enrollment.create({ class_id: class1.id, student_id: student4.id });
    
    await Enrollment.create({ class_id: class2.id, student_id: student1.id });
    await Enrollment.create({ class_id: class2.id, student_id: student2.id });
    
    await Enrollment.create({ class_id: class3.id, student_id: student3.id });
    await Enrollment.create({ class_id: class3.id, student_id: student4.id });
    
    // Create attendance records
    await Attendance.create({
      class_id: class1.id,
      student_id: student1.id,
      date: '2023-09-05',
      status: 'present',
      recorded_by: teacher1.id
    });
    
    await Attendance.create({
      class_id: class1.id,
      student_id: student2.id,
      date: '2023-09-05',
      status: 'present',
      recorded_by: teacher1.id
    });
    
    await Attendance.create({
      class_id: class1.id,
      student_id: student3.id,
      date: '2023-09-05',
      status: 'absent',
      recorded_by: teacher1.id
    });
    
    await Attendance.create({
      class_id: class1.id,
      student_id: student4.id,
      date: '2023-09-05',
      status: 'present',
      recorded_by: teacher1.id
    });
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Database seeding failed:', error);
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  models: {
    User,
    Department,
    Course,
    Class,
    Enrollment,
    Attendance
  },
  initializeDatabase,
  testConnection
};
